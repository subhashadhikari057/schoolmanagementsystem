import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Users,
  Edit,
  Trash2,
  Award,
  AlertTriangle,
} from 'lucide-react';
import {
  feeService,
  ScholarshipDefinition,
  ChargeDefinition,
} from '@/api/services/fee.service';
import { StudentSelectionModal, Student } from './StudentSelectionModal';
import { toast } from 'sonner';

interface CreateScholarshipForm {
  name: string;
  type: 'MERIT' | 'NEED_BASED' | 'SPORTS' | 'OTHER';
  valueType: 'PERCENTAGE' | 'FIXED';
  value: number;
}

interface CreateChargeForm {
  name: string;
  type: 'FINE' | 'EQUIPMENT' | 'TRANSPORT' | 'OTHER';
  valueType: 'PERCENTAGE' | 'FIXED';
  value: number;
  category?: string;
  isRecurring: boolean;
}

export const ScholarshipsCharges: React.FC = () => {
  // State for data
  const [scholarships, setScholarships] = useState<ScholarshipDefinition[]>([]);
  const [charges, setCharges] = useState<ChargeDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  // State for modals
  const [createScholarshipOpen, setCreateScholarshipOpen] = useState(false);
  const [createChargeOpen, setCreateChargeOpen] = useState(false);
  const [studentSelectionOpen, setStudentSelectionOpen] = useState(false);
  const [studentSelectionType, setStudentSelectionType] = useState<
    'scholarship' | 'charge'
  >('scholarship');
  const [selectedItem, setSelectedItem] = useState<
    ScholarshipDefinition | ChargeDefinition | null
  >(null);

  // State for forms
  const [scholarshipForm, setScholarshipForm] = useState<CreateScholarshipForm>(
    {
      name: '',
      type: 'MERIT',
      valueType: 'PERCENTAGE',
      value: 0,
    },
  );

  const [chargeForm, setChargeForm] = useState<CreateChargeForm>({
    name: '',
    type: 'FINE',
    valueType: 'FIXED',
    value: 0,
    category: '',
    isRecurring: false,
  });

  // Search states
  const [scholarshipSearch, setScholarshipSearch] = useState('');
  const [chargeSearch, setChargeSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scholarshipsRes, chargesRes] = await Promise.all([
        feeService.listScholarships(),
        feeService.listCharges(),
      ]);
      setScholarships(scholarshipsRes);
      setCharges(chargesRes);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load scholarships and charges');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScholarship = async () => {
    try {
      await feeService.createScholarship({
        name: scholarshipForm.name,
        type: scholarshipForm.type,
        valueType: scholarshipForm.valueType,
        value: scholarshipForm.value,
      });

      toast.success('Scholarship created successfully');
      setCreateScholarshipOpen(false);
      setScholarshipForm({
        name: '',
        type: 'MERIT',
        valueType: 'PERCENTAGE',
        value: 0,
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create scholarship:', error);
      toast.error('Failed to create scholarship');
    }
  };

  const handleCreateCharge = async () => {
    try {
      await feeService.createCharge({
        name: chargeForm.name,
        type: chargeForm.type,
        valueType: chargeForm.valueType,
        value: chargeForm.value,
        category: chargeForm.category || undefined,
        isRecurring: chargeForm.isRecurring,
      });

      toast.success('Charge created successfully');
      setCreateChargeOpen(false);
      setChargeForm({
        name: '',
        type: 'FINE',
        valueType: 'FIXED',
        value: 0,
        category: '',
        isRecurring: false,
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create charge:', error);
      toast.error('Failed to create charge');
    }
  };

  const handleAssignToStudents = (
    item: ScholarshipDefinition | ChargeDefinition,
    type: 'scholarship' | 'charge',
  ) => {
    setSelectedItem(item);
    setStudentSelectionType(type);
    setStudentSelectionOpen(true);
  };

  const handleStudentSelection = async (students: Student[]) => {
    if (!selectedItem) return;

    try {
      const studentIds = students.map(s => s.id);

      if (studentSelectionType === 'scholarship') {
        await feeService.assignScholarship({
          scholarshipId: selectedItem.id,
          studentIds,
          effectiveFrom: new Date().toISOString(),
        });
        toast.success(
          `Scholarship assigned to ${students.length} student${students.length > 1 ? 's' : ''}`,
        );
      } else {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        await feeService.applyCharge({
          chargeId: selectedItem.id,
          studentIds,
          appliedMonth: currentMonth,
          reason: `Applied ${selectedItem.name}`,
        });
        toast.success(
          `Charge applied to ${students.length} student${students.length > 1 ? 's' : ''}`,
        );
      }
    } catch (error) {
      console.error('Failed to assign/apply:', error);
      toast.error('Failed to assign/apply to students');
    }
  };

  const filteredScholarships = scholarships.filter(
    s =>
      s.name.toLowerCase().includes(scholarshipSearch.toLowerCase()) ||
      s.type.toLowerCase().includes(scholarshipSearch.toLowerCase()),
  );

  const filteredCharges = charges.filter(
    c =>
      c.name.toLowerCase().includes(chargeSearch.toLowerCase()) ||
      c.type.toLowerCase().includes(chargeSearch.toLowerCase()),
  );

  const formatValue = (valueType: string, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return valueType === 'PERCENTAGE' ? `${numValue}%` : `$${numValue}`;
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>
            Scholarships & Charges
          </h2>
          <p className='text-muted-foreground'>
            Manage scholarships and charges that can be applied to students
          </p>
        </div>
      </div>

      <Tabs defaultValue='scholarships' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='scholarships' className='flex items-center gap-2'>
            <Award className='h-4 w-4' />
            Scholarships
          </TabsTrigger>
          <TabsTrigger value='charges' className='flex items-center gap-2'>
            <AlertTriangle className='h-4 w-4' />
            Charges & Fines
          </TabsTrigger>
        </TabsList>

        {/* Scholarships Tab */}
        <TabsContent value='scholarships' className='space-y-4'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='flex items-center gap-2'>
                    <Award className='h-5 w-5' />
                    Scholarships
                  </CardTitle>
                  <CardDescription>
                    Create and manage scholarships that provide fee discounts to
                    students
                  </CardDescription>
                </div>
                <Dialog
                  open={createScholarshipOpen}
                  onOpenChange={setCreateScholarshipOpen}
                >
                  <DialogTrigger asChild>
                    <Button className='flex items-center gap-2'>
                      <Plus className='h-4 w-4' />
                      Create Scholarship
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Scholarship</DialogTitle>
                      <DialogDescription>
                        Create a scholarship that can be assigned to eligible
                        students
                      </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='scholarship-name'>
                          Scholarship Name
                        </Label>
                        <Input
                          id='scholarship-name'
                          placeholder='e.g., Merit Scholarship'
                          value={scholarshipForm.name}
                          onChange={e =>
                            setScholarshipForm({
                              ...scholarshipForm,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='scholarship-type'>Type</Label>
                        <Select
                          value={scholarshipForm.type}
                          onValueChange={(
                            value: 'MERIT' | 'NEED_BASED' | 'SPORTS' | 'OTHER',
                          ) =>
                            setScholarshipForm({
                              ...scholarshipForm,
                              type: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='MERIT'>Merit Based</SelectItem>
                            <SelectItem value='NEED_BASED'>
                              Need Based
                            </SelectItem>
                            <SelectItem value='SPORTS'>Sports</SelectItem>
                            <SelectItem value='OTHER'>Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='scholarship-value-type'>
                            Value Type
                          </Label>
                          <Select
                            value={scholarshipForm.valueType}
                            onValueChange={(value: 'PERCENTAGE' | 'FIXED') =>
                              setScholarshipForm({
                                ...scholarshipForm,
                                valueType: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='PERCENTAGE'>
                                Percentage
                              </SelectItem>
                              <SelectItem value='FIXED'>
                                Fixed Amount
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='scholarship-value'>Value</Label>
                          <Input
                            id='scholarship-value'
                            type='number'
                            placeholder={
                              scholarshipForm.valueType === 'PERCENTAGE'
                                ? '10'
                                : '100'
                            }
                            value={scholarshipForm.value || ''}
                            onChange={e =>
                              setScholarshipForm({
                                ...scholarshipForm,
                                value: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant='outline'
                        onClick={() => setCreateScholarshipOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateScholarship}
                        disabled={
                          !scholarshipForm.name || !scholarshipForm.value
                        }
                      >
                        Create Scholarship
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center gap-4'>
                  <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                      placeholder='Search scholarships...'
                      value={scholarshipSearch}
                      onChange={e => setScholarshipSearch(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScholarships.map(scholarship => (
                      <TableRow key={scholarship.id}>
                        <TableCell className='font-medium'>
                          {scholarship.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant='secondary'>{scholarship.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {formatValue(
                            scholarship.valueType,
                            scholarship.value,
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              scholarship.isActive ? 'default' : 'secondary'
                            }
                          >
                            {scholarship.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                handleAssignToStudents(
                                  scholarship,
                                  'scholarship',
                                )
                              }
                              className='flex items-center gap-1'
                            >
                              <Users className='h-3 w-3' />
                              Assign
                            </Button>
                            <Button size='sm' variant='ghost'>
                              <Edit className='h-3 w-3' />
                            </Button>
                            <Button size='sm' variant='ghost'>
                              <Trash2 className='h-3 w-3' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredScholarships.length === 0 && (
                  <div className='text-center py-8 text-muted-foreground'>
                    No scholarships found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charges Tab */}
        <TabsContent value='charges' className='space-y-4'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='flex items-center gap-2'>
                    <AlertTriangle className='h-5 w-5' />
                    Charges & Fines
                  </CardTitle>
                  <CardDescription>
                    Create and manage charges, fines, and additional fees that
                    can be applied to students
                  </CardDescription>
                </div>
                <Dialog
                  open={createChargeOpen}
                  onOpenChange={setCreateChargeOpen}
                >
                  <DialogTrigger asChild>
                    <Button className='flex items-center gap-2'>
                      <Plus className='h-4 w-4' />
                      Create Charge
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Charge</DialogTitle>
                      <DialogDescription>
                        Create a charge that can be applied to students
                      </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='charge-name'>Charge Name</Label>
                        <Input
                          id='charge-name'
                          placeholder='e.g., Late Payment Fee'
                          value={chargeForm.name}
                          onChange={e =>
                            setChargeForm({
                              ...chargeForm,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='charge-type'>Type</Label>
                        <Select
                          value={chargeForm.type}
                          onValueChange={(
                            value: 'FINE' | 'EQUIPMENT' | 'TRANSPORT' | 'OTHER',
                          ) => setChargeForm({ ...chargeForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='FINE'>Fine</SelectItem>
                            <SelectItem value='EQUIPMENT'>Equipment</SelectItem>
                            <SelectItem value='TRANSPORT'>Transport</SelectItem>
                            <SelectItem value='OTHER'>Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='charge-value-type'>Value Type</Label>
                          <Select
                            value={chargeForm.valueType}
                            onValueChange={(value: 'FIXED' | 'PERCENTAGE') =>
                              setChargeForm({ ...chargeForm, valueType: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='FIXED'>
                                Fixed Amount
                              </SelectItem>
                              <SelectItem value='PERCENTAGE'>
                                Percentage
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='charge-value'>Value</Label>
                          <Input
                            id='charge-value'
                            type='number'
                            placeholder={
                              chargeForm.valueType === 'PERCENTAGE' ? '5' : '50'
                            }
                            value={chargeForm.value || ''}
                            onChange={e =>
                              setChargeForm({
                                ...chargeForm,
                                value: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='charge-category'>
                          Category (Optional)
                        </Label>
                        <Input
                          id='charge-category'
                          placeholder='e.g., PAYMENT, BEHAVIOR, EQUIPMENT'
                          value={chargeForm.category}
                          onChange={e =>
                            setChargeForm({
                              ...chargeForm,
                              category: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className='flex items-center space-x-2'>
                        <input
                          type='checkbox'
                          id='charge-recurring'
                          checked={chargeForm.isRecurring}
                          onChange={e =>
                            setChargeForm({
                              ...chargeForm,
                              isRecurring: e.target.checked,
                            })
                          }
                        />
                        <Label htmlFor='charge-recurring'>
                          Recurring charge
                        </Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant='outline'
                        onClick={() => setCreateChargeOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateCharge}
                        disabled={!chargeForm.name || !chargeForm.value}
                      >
                        Create Charge
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center gap-4'>
                  <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                      placeholder='Search charges...'
                      value={chargeSearch}
                      onChange={e => setChargeSearch(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Recurring</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCharges.map(charge => (
                      <TableRow key={charge.id}>
                        <TableCell className='font-medium'>
                          {charge.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant='secondary'>{charge.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {formatValue(charge.valueType, charge.value)}
                        </TableCell>
                        <TableCell>
                          {(charge as any).category || 'General'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={charge.isRecurring ? 'default' : 'outline'}
                          >
                            {charge.isRecurring ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={charge.isActive ? 'default' : 'secondary'}
                          >
                            {charge.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                handleAssignToStudents(charge, 'charge')
                              }
                              className='flex items-center gap-1'
                            >
                              <Users className='h-3 w-3' />
                              Apply
                            </Button>
                            <Button size='sm' variant='ghost'>
                              <Edit className='h-3 w-3' />
                            </Button>
                            <Button size='sm' variant='ghost'>
                              <Trash2 className='h-3 w-3' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredCharges.length === 0 && (
                  <div className='text-center py-8 text-muted-foreground'>
                    No charges found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Student Selection Modal */}
      <StudentSelectionModal
        open={studentSelectionOpen}
        onClose={() => setStudentSelectionOpen(false)}
        onSelect={handleStudentSelection}
        title={`Select Students for ${selectedItem?.name}`}
        description={`Choose students to ${studentSelectionType === 'scholarship' ? 'assign scholarship to' : 'apply charge to'}`}
        allowMultiple={true}
      />
    </div>
  );
};
