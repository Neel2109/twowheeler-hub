import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert, ActivityIndicator, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import SignatureScreen from 'react-native-signature-canvas';
import { decode } from 'base64-arraybuffer';
import { RepairOrder, BRANDS, STATUS_OPTIONS, ROStatus, GSTInfo, ROMedia } from '@/types/repair-order';
import { Mechanic } from '@/types/mechanic';
import { generateRONumber, addRepairOrder, updateRepairOrder, calculateTotals } from '@/lib/repair-orders';
import { getMechanics } from '@/lib/mechanics';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { StatusBadge } from '@/components/StatusBadge';
import { Plus, Trash2, Save, Camera, PenTool } from 'lucide-react-native';
import * as crypto from 'expo-crypto';

interface Props {
  existing?: RepairOrder;
}

export function ROForm({ existing }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const isEdit = !!existing;
  const isDelivered = existing?.status === 'Delivered';
  const [saving, setSaving] = useState(false);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const signatureRef = useRef<any>(null);

  const [form, setForm] = useState<Omit<RepairOrder, 'id' | 'roNumber' | 'createdAt' | 'updatedAt'>>({
    dateIn: existing?.dateIn || new Date().toISOString().split('T')[0],
    customerName: existing?.customerName || '',
    mobileNumber: existing?.mobileNumber || '',
    vehicleNumber: existing?.vehicleNumber || '',
    vehicleType: existing?.vehicleType || 'Bike',
    brand: existing?.brand || '',
    model: existing?.model || '',
    customerComplaints: existing?.customerComplaints || '',
    serviceDetails: existing?.serviceDetails || '',
    remarks: existing?.remarks || '',
    status: existing?.status || 'Open',
    spareParts: existing?.spareParts || [],
    laborCharges: existing?.laborCharges || [],
    discount: existing?.discount || 0,
    gstInfo: existing?.gstInfo || { garageGSTIN: '', customerGSTIN: '', cgstRate: 9, sgstRate: 9 },
    mechanicId: existing?.mechanicId || undefined,
    isEstimate: existing?.isEstimate || false,
    customerSignatureUrl: existing?.customerSignatureUrl || undefined,
    media: existing?.media || [],
  });

  useEffect(() => {
    getMechanics().then(setMechanics).catch(console.error);
  }, []);

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const addPart = () => update('spareParts', [...form.spareParts, { id: crypto.randomUUID(), partName: '', hsnCode: '', quantity: 1, rate: 0, total: 0 }]);
  const updatePart = (id: string, field: string, value: any) => {
    update('spareParts', form.spareParts.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      updated.total = updated.quantity * updated.rate;
      return updated;
    }));
  };
  const removePart = (id: string) => update('spareParts', form.spareParts.filter(p => p.id !== id));

  const addLabor = () => update('laborCharges', [...form.laborCharges, { id: crypto.randomUUID(), description: '', amount: 0 }]);
  const updateLabor = (id: string, field: string, value: any) => update('laborCharges', form.laborCharges.map(l => l.id === id ? { ...l, [field]: value } : l));
  const removeLabor = (id: string) => update('laborCharges', form.laborCharges.filter(l => l.id !== id));

  const { partsTotal, laborTotal, subtotal, taxableAmount, cgstAmount, sgstAmount, totalGST, finalAmount } = calculateTotals(form.spareParts, form.laborCharges, form.discount, form.gstInfo);

  const uploadBase64 = async (base64Str: string, path: string) => {
    const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, '');
    const { error } = await supabase.storage.from('ro_media').upload(path, decode(base64Data), { contentType: 'image/png', upsert: true });
    if (error) throw error;
    return supabase.storage.from('ro_media').getPublicUrl(path).data.publicUrl;
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    
    if (!result.canceled && result.assets[0].base64) {
      setSaving(true);
      try {
        const path = `photos/${crypto.randomUUID()}.png`;
        const url = await uploadBase64(result.assets[0].base64, path);
        const newMedia: ROMedia = { id: crypto.randomUUID(), repairOrderId: existing?.id || '', mediaUrl: url, mediaType: 'image', description: 'Vehicle Photo' };
        update('media', [...(form.media || []), newMedia]);
      } catch (err: any) {
        Alert.alert('Upload Error', err.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSignature = async (signatureBase64: string) => {
    setSaving(true);
    try {
      const path = `signatures/${crypto.randomUUID()}.png`;
      const url = await uploadBase64(signatureBase64, path);
      update('customerSignatureUrl', url);
      setShowSignaturePad(false);
    } catch (err: any) {
      Alert.alert('Upload Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.customerName || !form.mobileNumber || !form.vehicleNumber || !form.brand || !form.model) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    if (!user) return Alert.alert('Error', 'You must be logged in');

    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (isEdit && existing) {
        const updated = { ...existing, ...form, updatedAt: now };
        await updateRepairOrder(updated);
        
        // Save new media records if needed (assuming backend function handles this or we insert manually)
        // For simplicity, we assume media is inserted here if not existing
        if (form.media && form.media.length > 0) {
           const newMedias = form.media.filter(m => m.repairOrderId === '');
           if(newMedias.length > 0) {
             const toInsert = newMedias.map(m => ({ repair_order_id: existing.id, media_url: m.mediaUrl, media_type: m.mediaType, description: m.description }));
             await supabase.from('ro_media').insert(toInsert);
           }
        }
        
        Alert.alert('Success', 'Repair Order updated');
        router.replace(`/orders/${existing.id}`);
      } else {
        const roNumber = await generateRONumber();
        const roId = crypto.randomUUID();
        const order: RepairOrder = { id: roId, roNumber, ...form, createdAt: now, updatedAt: now };
        await addRepairOrder(order, user.id);
        
        if (form.media && form.media.length > 0) {
           const toInsert = form.media.map(m => ({ repair_order_id: roId, media_url: m.mediaUrl, media_type: m.mediaType, description: m.description }));
           await supabase.from('ro_media').insert(toInsert);
        }
        
        Alert.alert('Success', `Order ${order.roNumber} created`);
        router.replace(`/orders/${roId}`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (label: string, value: any, onChange: (val: string) => void, placeholder?: string, keyboardType?: any, multiline = false) => (
    <View className="mb-4">
      <Text className="text-sm font-medium mb-1.5 text-foreground">{label}</Text>
      <TextInput
        className={`w-full border border-input rounded-md px-3 bg-background text-foreground ${multiline ? 'py-3 min-h-[80px]' : 'h-10'}`}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        editable={!isDelivered}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className="text-2xl font-bold text-foreground">{isEdit ? `Edit ${existing.roNumber}` : 'New Repair Order'}</Text>
          {isEdit && <View className="mt-1"><StatusBadge status={form.status as ROStatus} /></View>}
        </View>
        <Pressable 
          onPress={handleSave} 
          disabled={isDelivered || saving}
          className={`flex-row items-center px-4 py-2 rounded-md ${isDelivered || saving ? 'bg-primary/50' : 'bg-primary'}`}
        >
          {saving ? <ActivityIndicator size="small" color="white" /> : <Save size={16} color="white" className="mr-2" />}
          <Text className="text-white font-medium ml-1">{isEdit ? 'Update' : 'Create'}</Text>
        </Pressable>
      </View>

      {/* Estimates Toggle */}
      <View className="bg-card p-4 rounded-xl border border-border mb-4 flex-row justify-between items-center">
        <View>
          <Text className="text-lg font-semibold text-foreground">Estimate / Quotation</Text>
          <Text className="text-sm text-muted-foreground">Mark as estimate before confirming repair</Text>
        </View>
        <Switch
          value={form.isEstimate}
          onValueChange={val => update('isEstimate', val)}
          disabled={isDelivered}
        />
      </View>

      {/* Basic Info */}
      <View className="bg-card p-4 rounded-xl border border-border mb-4">
        <Text className="text-lg font-semibold text-foreground mb-4">Customer Details</Text>
        {renderInput('Customer Name *', form.customerName, val => update('customerName', val))}
        {renderInput('Mobile Number *', form.mobileNumber, val => update('mobileNumber', val), '10 digit number', 'phone-pad')}
        {renderInput('Date In', form.dateIn, val => update('dateIn', val), 'YYYY-MM-DD')}
      </View>

      <View className="bg-card p-4 rounded-xl border border-border mb-4">
        <Text className="text-lg font-semibold text-foreground mb-4">Vehicle Details</Text>
        {renderInput('Vehicle No. *', form.vehicleNumber, val => update('vehicleNumber', val.toUpperCase()), 'MH12AB1234')}
        {renderInput('Brand *', form.brand, val => update('brand', val), 'Honda, Bajaj...')}
        {renderInput('Model *', form.model, val => update('model', val))}
      </View>

      <View className="bg-card p-4 rounded-xl border border-border mb-4">
        <Text className="text-lg font-semibold text-foreground mb-4">Service Information</Text>
        <View className="mb-4">
          <Text className="text-sm font-medium mb-1.5 text-foreground">Assigned Mechanic</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
            <Pressable
              onPress={() => update('mechanicId', undefined)}
              className={`px-3 py-1.5 rounded-full border mr-2 ${!form.mechanicId ? 'bg-primary border-primary' : 'bg-transparent border-input'}`}
            >
              <Text className={!form.mechanicId ? 'text-white' : 'text-foreground'}>Unassigned</Text>
            </Pressable>
            {mechanics.map(m => (
              <Pressable
                key={m.id}
                onPress={() => update('mechanicId', m.id)}
                className={`px-3 py-1.5 rounded-full border mr-2 ${form.mechanicId === m.id ? 'bg-primary border-primary' : 'bg-transparent border-input'}`}
              >
                <Text className={form.mechanicId === m.id ? 'text-white' : 'text-foreground'}>{m.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {isEdit && renderInput('Status (Open, In Progress, etc)', form.status, val => update('status', val))}
        {renderInput('Customer Complaints', form.customerComplaints, val => update('customerComplaints', val), '', 'default', true)}
        {renderInput('Service Details', form.serviceDetails, val => update('serviceDetails', val), '', 'default', true)}
      </View>

      {/* Spare Parts */}
      <View className="bg-card p-4 rounded-xl border border-border mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-foreground">Spare Parts</Text>
          {!isDelivered && (
            <Pressable onPress={addPart} className="flex-row items-center border border-border px-3 py-1.5 rounded-md">
              <Plus size={14} color="hsl(222.2 84% 4.9%)" />
              <Text className="text-sm font-medium ml-1">Add Part</Text>
            </Pressable>
          )}
        </View>
        {form.spareParts.length === 0 ? (
          <Text className="text-sm text-muted-foreground text-center py-2">No spare parts added</Text>
        ) : (
          form.spareParts.map(p => (
            <View key={p.id} className="mb-4 bg-muted/50 p-3 rounded-lg border border-border/50">
              <TextInput className="w-full border border-input rounded-md px-3 h-10 bg-background mb-2" value={p.partName} onChangeText={val => updatePart(p.id, 'partName', val)} placeholder="Part name" editable={!isDelivered} />
              <View className="flex-row gap-x-2">
                <TextInput className="flex-1 border border-input rounded-md px-3 h-10 bg-background" value={p.quantity.toString()} onChangeText={val => updatePart(p.id, 'quantity', Number(val) || 0)} placeholder="Qty" keyboardType="numeric" editable={!isDelivered} />
                <TextInput className="flex-1 border border-input rounded-md px-3 h-10 bg-background" value={p.rate.toString()} onChangeText={val => updatePart(p.id, 'rate', Number(val) || 0)} placeholder="Rate" keyboardType="numeric" editable={!isDelivered} />
                <View className="flex-1 justify-center items-end px-2"><Text className="font-mono font-medium">₹{p.total.toFixed(2)}</Text></View>
                {!isDelivered && <Pressable onPress={() => removePart(p.id)} className="justify-center px-2"><Trash2 size={18} color="#ef4444" /></Pressable>}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Labor Charges */}
      <View className="bg-card p-4 rounded-xl border border-border mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-foreground">Labor Charges</Text>
          {!isDelivered && (
            <Pressable onPress={addLabor} className="flex-row items-center border border-border px-3 py-1.5 rounded-md">
              <Plus size={14} color="hsl(222.2 84% 4.9%)" />
              <Text className="text-sm font-medium ml-1">Add Labor</Text>
            </Pressable>
          )}
        </View>
        {form.laborCharges.length === 0 ? (
          <Text className="text-sm text-muted-foreground text-center py-2">No labor charges</Text>
        ) : (
          form.laborCharges.map(l => (
            <View key={l.id} className="flex-row gap-x-2 mb-2 items-center">
              <TextInput className="flex-[2] border border-input rounded-md px-3 h-10 bg-background" value={l.description} onChangeText={val => updateLabor(l.id, 'description', val)} placeholder="Description" editable={!isDelivered} />
              <TextInput className="flex-1 border border-input rounded-md px-3 h-10 bg-background" value={l.amount.toString()} onChangeText={val => updateLabor(l.id, 'amount', Number(val) || 0)} placeholder="Amount" keyboardType="numeric" editable={!isDelivered} />
              {!isDelivered && <Pressable onPress={() => removeLabor(l.id)} className="px-2"><Trash2 size={18} color="#ef4444" /></Pressable>}
            </View>
          ))
        )}
      </View>

      {/* Media Attachments */}
      <View className="bg-card p-4 rounded-xl border border-border mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-foreground">Vehicle Photos</Text>
          {!isDelivered && (
            <Pressable onPress={handlePickImage} className="flex-row items-center border border-border px-3 py-1.5 rounded-md">
              <Camera size={14} color="hsl(222.2 84% 4.9%)" />
              <Text className="text-sm font-medium ml-1">Add Photo</Text>
            </Pressable>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {form.media?.filter(m => m.mediaType === 'image').map((m, i) => (
            <View key={m.id || i} className="mr-3 relative">
              <Image source={{ uri: m.mediaUrl }} className="w-24 h-24 rounded-lg bg-muted" />
            </View>
          ))}
          {form.media?.filter(m => m.mediaType === 'image').length === 0 && (
            <Text className="text-sm text-muted-foreground">No photos attached.</Text>
          )}
        </ScrollView>
      </View>

      {/* Customer Signature */}
      <View className="bg-card p-4 rounded-xl border border-border mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-foreground">Customer Signature</Text>
          {!form.customerSignatureUrl && !isDelivered && (
            <Pressable onPress={() => setShowSignaturePad(true)} className="flex-row items-center bg-primary px-3 py-1.5 rounded-md">
              <PenTool size={14} color="white" />
              <Text className="text-sm font-medium text-white ml-1">Sign Now</Text>
            </Pressable>
          )}
        </View>
        {form.customerSignatureUrl ? (
          <Image source={{ uri: form.customerSignatureUrl }} className="w-full h-32 bg-muted rounded-lg" resizeMode="contain" />
        ) : (
          <Text className="text-sm text-muted-foreground">No signature captured.</Text>
        )}
        
        {showSignaturePad && (
          <View className="mt-4 h-64 border border-border rounded-lg overflow-hidden relative">
            <SignatureScreen
              ref={signatureRef}
              onOK={handleSignature}
              onEmpty={() => Alert.alert('Empty', 'Please sign before saving.')}
              descriptionText="Sign above"
              clearText="Clear"
              confirmText="Save"
              webStyle={`.m-signature-pad {box-shadow: none; border: none;} 
                         .m-signature-pad--body {border: none;} 
                         .m-signature-pad--footer {display: none;}`}
            />
            <View className="flex-row justify-between absolute bottom-2 left-2 right-2 px-2">
               <Pressable onPress={() => signatureRef.current?.clearSignature()} className="bg-muted px-4 py-2 rounded-md"><Text className="text-foreground">Clear</Text></Pressable>
               <Pressable onPress={() => signatureRef.current?.readSignature()} className="bg-primary px-4 py-2 rounded-md"><Text className="text-white">Save</Text></Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Totals */}
      <View className="bg-primary/5 p-5 rounded-xl border border-primary/30 mb-8">
        <View className="gap-y-2 text-sm">
          <View className="flex-row justify-between"><Text className="text-muted-foreground">Parts Total:</Text><Text className="font-mono text-foreground">₹{partsTotal.toFixed(2)}</Text></View>
          <View className="flex-row justify-between"><Text className="text-muted-foreground">Labor Total:</Text><Text className="font-mono text-foreground">₹{laborTotal.toFixed(2)}</Text></View>
          <View className="flex-row justify-between"><Text className="text-muted-foreground">Subtotal:</Text><Text className="font-mono font-semibold text-foreground">₹{subtotal.toFixed(2)}</Text></View>
          
          <View className="flex-row justify-between items-center my-1">
            <Text className="text-muted-foreground">Discount:</Text>
            <TextInput className="border border-input rounded-md px-2 h-8 bg-background text-right w-24 font-mono" value={form.discount.toString()} onChangeText={val => update('discount', Number(val) || 0)} keyboardType="numeric" editable={!isDelivered} />
          </View>
          
          <View className="flex-row justify-between mt-2 pt-2 border-t border-primary/30">
            <Text className="font-bold text-primary text-lg">Final Amount:</Text>
            <Text className="font-mono font-bold text-primary text-lg">₹{finalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
