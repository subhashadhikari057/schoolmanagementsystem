'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select, {
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { AssetCategory } from '@/types/asset.types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdModels?: any[]) => void;
  targetRoomId?: string;
}

interface AssetFormData {
  nameOfAsset: string;
  brand: string;
  modelNo: string;
  serialNo: string;
  vendorName: string;
  vendorPanVat: string;
  vendorAddress: string;
  vendorContactDetails: string;
  paymentTiming: 'installment' | 'full_payment';
  paymentMode: 'cash' | 'bank';
  invoiceDate: string;
  settlementDate: string;
  ledgerNo: string;
  purchaseValue: number;
  transportationCharges: number;
  assetCategory: AssetCategory;
  budgetHead: string;
  noOfQuantity: number;
  rate: number;
  totalValue: number;
  hsCode: string;
  assignedDate: string;
  assignedPlace: string;
  status: 'under_repair' | 'to_repair' | 'ok' | 'written_off';
  acquisitionFormCreationDate: string;
}
