'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateRequestSchema } from '../../../../lib/types';
import { z } from 'zod';

type CreateRequestFormData = z.infer<typeof CreateRequestSchema>;

interface UploadedFile {
  url: string;
  filename: string;
  size: number;
}

/* GLOBAL CSS TO REMOVE NUMBER INPUT ARROWS */
const removeNumberArrows = `
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

export default function CreateRequestPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateRequestFormData>({
    resolver: zodResolver(CreateRequestSchema),
    defaultValues: { attachments: [] }
  });

  /* 🔹 FORM SUBMIT HANDLER */
  const onSubmit = async (data: CreateRequestFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const requestData = {
        ...data,
        attachments: uploadedFiles.map(file => file.url),
      };

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create request');
      }

      const result = await response.json();
      router.push(`/dashboard/requests/${result._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* 🔹 FILE UPLOAD HANDLER (PDF ONLY) */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const validFiles = [...files].filter(file => file.type === "application/pdf");

    if (validFiles.length !== files.length) {
      setError("Only PDF documents are allowed.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to upload file");
        }

        const uploaded = await response.json();
        setUploadedFiles(prev => [...prev, uploaded]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">

      {/* Inject CSS to remove number arrows */}
      <style>{removeNumberArrows}</style>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Request</h1>
        <p className="text-gray-600">Fill in the details for your new request</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* FORM FIELDS */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

          {/* Title */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              {...register("title")}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.title && <p className="text-red-600 text-sm">{errors.title.message}</p>}
          </div>

          {/* Purpose */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Purpose</label>
            <textarea
              rows={4}
              {...register("purpose")}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.purpose && <p className="text-red-600 text-sm">{errors.purpose.message}</p>}
          </div>

          {/* College */}
          <div>
            <label className="block text-sm font-medium text-gray-700">College</label>
            <input
              type="text"
              {...register("college")}
              className="mt-1 block w-full rounded-md border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              {...register("department")}
              className="mt-1 block w-full rounded-md border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Cost Estimate */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Cost Estimate (₹)</label>
            <input
              type="number"
              inputMode="decimal"
              {...register("costEstimate", { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Expense Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Expense Category</label>
            <input
              type="text"
              {...register("expenseCategory")}
              className="mt-1 block w-full rounded-md border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* SOP Reference */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">SOP Reference (Optional)</label>
            <input
              type="text"
              {...register("sopReference")}
              className="mt-1 block w-full rounded-md border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* DOCUMENT UPLOAD */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-700">Document Attachments (PDF Only)</label>
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {isUploading ? "Uploading..." : "+ Add Document"}
            </button>
          </div>

          {uploadedFiles.length > 0 ? (
            <ul className="border rounded-md divide-y">
              {uploadedFiles.map((file, i) => (
                <li key={i} className="flex justify-between items-center p-2">
                  <span className="text-sm flex-1 truncate">{file.filename}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(i)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No files uploaded</p>
          )}
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
