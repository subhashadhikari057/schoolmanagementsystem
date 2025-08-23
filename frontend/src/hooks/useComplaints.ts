import { useState, useEffect, useCallback } from 'react';
import { complaintService } from '@/api/services/complaint.service';
import { complaintAttachmentService } from '@/api/services/complaint-attachment.service';
import { complaintResponseService } from '@/api/services/complaint-response.service';
import {
  Complaint,
  ComplaintListResponse,
  ComplaintQueryParams,
  CreateComplaintRequest,
  UpdateComplaintRequest,
  ComplaintAttachment,
  CreateComplaintResponseRequest,
  ComplaintResponse,
  FileUploadProgress,
  ComplaintStats,
} from '@/api/types/complaint';

// =============================================================================
// Main Complaint Hooks
// =============================================================================

export const useComplaints = (params?: ComplaintQueryParams) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await complaintService.getAllComplaints(params);
      setComplaints(response.data.complaints);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch complaints',
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const createComplaint = useCallback(async (data: CreateComplaintRequest) => {
    try {
      const response = await complaintService.createComplaint(data);
      setComplaints(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error('Failed to create complaint');
    }
  }, []);

  const updateComplaint = useCallback(
    async (id: string, data: UpdateComplaintRequest) => {
      try {
        const response = await complaintService.updateComplaint(id, data);
        setComplaints(prev => prev.map(c => (c.id === id ? response.data : c)));
        return response.data;
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error('Failed to update complaint');
      }
    },
    [],
  );

  const assignComplaint = useCallback(
    async (id: string, assignedToId: string) => {
      try {
        const response = await complaintService.assignComplaint(
          id,
          assignedToId,
        );
        setComplaints(prev => prev.map(c => (c.id === id ? response.data : c)));
        return response.data;
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error('Failed to assign complaint');
      }
    },
    [],
  );

  const resolveComplaint = useCallback(
    async (id: string, resolution: string) => {
      try {
        const response = await complaintService.resolveComplaint(
          id,
          resolution,
        );
        setComplaints(prev => prev.map(c => (c.id === id ? response.data : c)));
        return response.data;
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error('Failed to resolve complaint');
      }
    },
    [],
  );

  return {
    complaints,
    loading,
    error,
    pagination,
    fetchComplaints,
    createComplaint,
    updateComplaint,
    assignComplaint,
    resolveComplaint,
  };
};

export const useComplaint = (id: string) => {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaint = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await complaintService.getComplaintById(id);
      setComplaint(response.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch complaint',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  const updateComplaint = useCallback(
    async (data: UpdateComplaintRequest) => {
      if (!id) return;

      try {
        const response = await complaintService.updateComplaint(id, data);
        setComplaint(response.data);
        return response.data;
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error('Failed to update complaint');
      }
    },
    [id],
  );

  const assignComplaint = useCallback(
    async (assignedToId: string) => {
      if (!id) return;

      try {
        const response = await complaintService.assignComplaint(
          id,
          assignedToId,
        );
        setComplaint(response.data);
        return response.data;
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error('Failed to assign complaint');
      }
    },
    [id],
  );

  const resolveComplaint = useCallback(
    async (resolution: string) => {
      if (!id) return;

      try {
        const response = await complaintService.resolveComplaint(
          id,
          resolution,
        );
        setComplaint(response.data);
        return response.data;
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error('Failed to resolve complaint');
      }
    },
    [id],
  );

  return {
    complaint,
    loading,
    error,
    fetchComplaint,
    updateComplaint,
    assignComplaint,
    resolveComplaint,
  };
};

// =============================================================================
// Attachment Hooks
// =============================================================================

export const useComplaintAttachments = (complaintId: string) => {
  const [attachments, setAttachments] = useState<ComplaintAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>(
    [],
  );

  const fetchAttachments = useCallback(async () => {
    if (!complaintId) return;

    try {
      setLoading(true);
      setError(null);
      const response =
        await complaintAttachmentService.getAttachments(complaintId);
      setAttachments(response.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch attachments',
      );
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const uploadAttachments = useCallback(
    async (files: File[]) => {
      if (!complaintId) return;

      try {
        const response = await complaintAttachmentService.uploadAttachments(
          complaintId,
          files,
          progress => setUploadProgress(progress),
        );
        setAttachments(prev => [...prev, ...response.data.attachments]);
        setUploadProgress([]);
        return response.data;
      } catch (err) {
        setUploadProgress([]);
        throw err instanceof Error
          ? err
          : new Error('Failed to upload attachments');
      }
    },
    [complaintId],
  );

  const deleteAttachment = useCallback(
    async (attachmentId: string) => {
      if (!complaintId) return;

      try {
        await complaintAttachmentService.deleteAttachment(
          complaintId,
          attachmentId,
        );
        setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error('Failed to delete attachment');
      }
    },
    [complaintId],
  );

  const downloadAttachment = useCallback(
    async (attachment: ComplaintAttachment) => {
      try {
        await complaintAttachmentService.downloadAttachment(attachment);
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error('Failed to download attachment');
      }
    },
    [],
  );

  const openAttachment = useCallback((attachment: ComplaintAttachment) => {
    complaintAttachmentService.openAttachmentInNewTab(attachment);
  }, []);

  return {
    attachments,
    loading,
    error,
    uploadProgress,
    fetchAttachments,
    uploadAttachments,
    deleteAttachment,
    downloadAttachment,
    openAttachment,
  };
};

// =============================================================================
// Response Hooks
// =============================================================================

export const useComplaintResponses = (complaintId: string) => {
  const [responses, setResponses] = useState<ComplaintResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    if (!complaintId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await complaintResponseService.getResponses(complaintId);
      // The backend returns { message: 'Responses retrieved', responses: ComplaintResponse[] }
      // So we need to access response.data.responses, not response.data directly
      const responsesData = (response.data as any).responses || response.data;
      setResponses(responsesData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch responses',
      );
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const createResponse = useCallback(
    async (data: CreateComplaintResponseRequest) => {
      if (!complaintId) return;

      try {
        const response = await complaintResponseService.createResponse(
          complaintId,
          data,
        );
        setResponses(prev => [...prev, response.data]);
        return response.data;
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error('Failed to create response');
      }
    },
    [complaintId],
  );

  const getResponseStats = useCallback(() => {
    return complaintResponseService.getResponseStats(responses);
  }, [responses]);

  const getResponseTimeline = useCallback(() => {
    return complaintResponseService.getResponseTimeline(responses);
  }, [responses]);

  return {
    responses,
    loading,
    error,
    fetchResponses,
    createResponse,
    getResponseStats,
    getResponseTimeline,
  };
};

// =============================================================================
// Utility Hooks
// =============================================================================

export const useComplaintStats = () => {
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // This would need to be implemented in the backend
      // const response = await complaintService.getStats();
      // setStats(response.data);

      // Mock stats for now
      setStats({
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        escalated: 0,
        byPriority: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 },
        byType: {
          ACADEMIC: 0,
          BEHAVIORAL: 0,
          FACILITY: 0,
          SAFETY: 0,
          BULLYING: 0,
          DISCIPLINARY: 0,
          FINANCIAL: 0,
          ADMINISTRATIVE: 0,
          OTHER: 0,
        },
        byRecipientType: { CLASS_TEACHER: 0, ADMINISTRATION: 0, PARENT: 0 },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
};

export const useComplaintForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'ACADEMIC' as const,
    priority: 'MEDIUM' as const,
    recipientType: 'ADMINISTRATION' as const,
    recipientId: '',
    attachments: [] as File[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback(
    (field: string, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear error for this field
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    },
    [errors],
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    }

    // Validate attachments
    if (formData.attachments.length > 0) {
      const validationResults = formData.attachments.map(file =>
        complaintAttachmentService.validateFile(file),
      );

      const invalidFiles = validationResults.filter(result => !result.isValid);
      if (invalidFiles.length > 0) {
        newErrors.attachments = invalidFiles
          .map(result => result.error)
          .join(', ');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const submitForm = useCallback(async () => {
    if (!validateForm()) {
      return null;
    }

    setIsSubmitting(true);
    try {
      const { attachments, ...complaintData } = formData;
      const response = await complaintService.createComplaint(complaintData);

      // Upload attachments if any
      if (attachments.length > 0) {
        await complaintAttachmentService.uploadAttachments(
          response.data.id,
          attachments,
        );
      }

      return response.data;
    } catch (err) {
      setErrors({
        general:
          err instanceof Error ? err.message : 'Failed to create complaint',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      type: 'ACADEMIC',
      priority: 'MEDIUM',
      recipientType: 'ADMINISTRATION',
      recipientId: '',
      attachments: [],
    });
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    validateForm,
    submitForm,
    resetForm,
  };
};
