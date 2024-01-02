// components/CreateButtonModal.tsx
import React from "react";

interface CreateButtonModalProps {
  isOpen: boolean;
  mandatoryFields: string[];
  errorFields: { field: string; message: string }[];
  onClose: () => void;
}

const CreateButtonModal: React.FC<CreateButtonModalProps> = ({ isOpen, mandatoryFields, errorFields, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-20 flex h-full w-full items-center justify-center overflow-y-auto bg-gray-600 bg-opacity-50">
      <div className="rounded-lg bg-white p-4 shadow-md">
        <div className="flex justify-center">
          <h1 className="mb-3 text-3xl font-semibold">Error</h1>
        </div>
        <h2 className="text-lg font-semibold">Required Fields</h2>
        {mandatoryFields.length > 0 ? (
          <ul>
            {mandatoryFields.map((field) => (
              <li className="text-red-500" key={field}>
                {field}
              </li>
            ))}
          </ul>
        ) : (
          <p>No mandatory fields missing.</p>
        )}
        <h2 className="mt-4 text-lg font-semibold">Error Fields</h2>
        {errorFields.length > 0 ? (
          <ul>
            {errorFields.map((error) => (
              <li className="text-red-500" key={error.field}>{`${error.field}: ${error.message}`}</li>
            ))}
          </ul>
        ) : (
          <p>No errors in fields.</p>
        )}
        <div className="flex justify-center">
          <button className="mt-4 rounded bg-main-orange px-4 py-2 text-white hover:bg-orange-500" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateButtonModal;
