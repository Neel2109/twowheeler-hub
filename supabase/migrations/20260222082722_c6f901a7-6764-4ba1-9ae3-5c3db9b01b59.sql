
-- Create repair_orders table
CREATE TABLE public.repair_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ro_number TEXT NOT NULL UNIQUE,
  date_in DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'Bike' CHECK (vehicle_type IN ('Bike', 'Scooter')),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  customer_complaints TEXT DEFAULT '',
  service_details TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Waiting for Parts', 'Ready for Delivery', 'Delivered')),
  discount NUMERIC NOT NULL DEFAULT 0,
  garage_gstin TEXT DEFAULT '',
  customer_gstin TEXT DEFAULT '',
  cgst_rate NUMERIC NOT NULL DEFAULT 9,
  sgst_rate NUMERIC NOT NULL DEFAULT 9,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create spare_parts table
CREATE TABLE public.spare_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repair_order_id UUID NOT NULL REFERENCES public.repair_orders(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL,
  hsn_code TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  rate NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0
);

-- Create labor_charges table
CREATE TABLE public.labor_charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repair_order_id UUID NOT NULL REFERENCES public.repair_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.repair_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor_charges ENABLE ROW LEVEL SECURITY;

-- RLS policies for repair_orders
CREATE POLICY "Users can view own orders" ON public.repair_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.repair_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.repair_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own orders" ON public.repair_orders FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for spare_parts (via repair_order ownership)
CREATE POLICY "Users can view own parts" ON public.spare_parts FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.repair_orders WHERE id = spare_parts.repair_order_id AND user_id = auth.uid()));
CREATE POLICY "Users can create own parts" ON public.spare_parts FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.repair_orders WHERE id = spare_parts.repair_order_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own parts" ON public.spare_parts FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.repair_orders WHERE id = spare_parts.repair_order_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own parts" ON public.spare_parts FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.repair_orders WHERE id = spare_parts.repair_order_id AND user_id = auth.uid()));

-- RLS policies for labor_charges
CREATE POLICY "Users can view own labor" ON public.labor_charges FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.repair_orders WHERE id = labor_charges.repair_order_id AND user_id = auth.uid()));
CREATE POLICY "Users can create own labor" ON public.labor_charges FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.repair_orders WHERE id = labor_charges.repair_order_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own labor" ON public.labor_charges FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.repair_orders WHERE id = labor_charges.repair_order_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own labor" ON public.labor_charges FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.repair_orders WHERE id = labor_charges.repair_order_id AND user_id = auth.uid()));

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_repair_orders_updated_at
  BEFORE UPDATE ON public.repair_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for common queries
CREATE INDEX idx_repair_orders_user_id ON public.repair_orders(user_id);
CREATE INDEX idx_repair_orders_date_in ON public.repair_orders(date_in);
CREATE INDEX idx_repair_orders_vehicle_number ON public.repair_orders(vehicle_number);
CREATE INDEX idx_repair_orders_mobile_number ON public.repair_orders(mobile_number);
CREATE INDEX idx_repair_orders_status ON public.repair_orders(status);
CREATE INDEX idx_spare_parts_order ON public.spare_parts(repair_order_id);
CREATE INDEX idx_labor_charges_order ON public.labor_charges(repair_order_id);
