import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/integrations/supabase/client';
import { Wrench } from 'lucide-react-native';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        Alert.alert('Success', 'Check your email to confirm your account');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-background p-4">
      <View className="w-full max-w-md bg-card p-6 rounded-xl border border-border shadow-sm">
        <View className="items-center mb-6">
          <View className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-3">
            <Wrench size={28} color="white" />
          </View>
          <Text className="text-2xl font-bold text-foreground">Patidar Auto Care</Text>
          <Text className="text-sm text-muted-foreground">Two-Wheeler Service Center</Text>
        </View>

        <View className="gap-y-4">
          <View>
            <Text className="text-sm font-medium mb-1.5 text-foreground">Email</Text>
            <TextInput
              className="w-full border border-input rounded-md px-3 h-10 bg-background text-foreground"
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View>
            <Text className="text-sm font-medium mb-1.5 text-foreground">Password</Text>
            <TextInput
              className="w-full border border-input rounded-md px-3 h-10 bg-background text-foreground"
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          <Pressable 
            onPress={handleSubmit} 
            disabled={loading}
            className="w-full bg-primary h-10 rounded-md items-center justify-center mt-2"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-primary-foreground font-medium">
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Text>
            )}
          </Pressable>
        </View>

        <View className="mt-6 flex-row items-center justify-center">
          <Text className="text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </Text>
          <Pressable onPress={() => setIsLogin(!isLogin)}>
            <Text className="text-primary font-medium text-sm">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
