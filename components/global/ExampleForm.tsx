import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import FormErrorMessage from './FormErrorMessage';

const exampleSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/.*[a-z].*/, 'Password must contain at least one lowercase letter')
    .regex(/.*[A-Z].*/, 'Password must contain at least one uppercase letter')
    .regex(/.*\d.*/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ExampleFormData = z.infer<typeof exampleSchema>;

export default function ExampleForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ExampleFormData>({
    resolver: zodResolver(exampleSchema),
  });

  const onSubmit = (data: ExampleFormData) => {
    console.log('Form submitted:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <input
          type="text"
          {...register('username')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter username"
        />
        <FormErrorMessage error={errors.username} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          {...register('email')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter email"
        />
        <FormErrorMessage error={errors.email} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          {...register('password')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter password"
        />
        <FormErrorMessage error={errors.password} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <input
          type="password"
          {...register('confirmPassword')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Confirm password"
        />
        <FormErrorMessage error={errors.confirmPassword} />
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register('terms')}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">I accept the terms and conditions</span>
        </label>
        <FormErrorMessage error={errors.terms} />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
      >
        Submit
      </button>
    </form>
  );
}
