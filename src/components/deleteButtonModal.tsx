// components/DeleteButtonModal.tsx
import React from "react";

interface DeleteButtonModalProps {
  isOpen: boolean;
  userID: string;
  userName: string;
  onClose: () => void;
  onDelete: () => void;
}

const DeleteButtonModal: React.FC<DeleteButtonModalProps> = ({ isOpen, userID, userName, onClose, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div className="text-normal fixed inset-0 z-20 flex h-full w-full items-center justify-center overflow-y-auto bg-gray-600 bg-opacity-50">
      <div className="rounded-lg bg-white p-4 shadow-md">
        <div className="flex justify-center">
          <h1 className="mb-3 text-3xl font-semibold">Deleting record</h1>
        </div>
        <h2 className="mb-2 text-lg font-semibold">Are you sure you want to delete this record?</h2>
        <div className="flex justify-around rounded-md border-2">
          <div>ID: {userID}</div>
          <div>Record: {userName}</div>
        </div>
        <div className="flex justify-around">
          <button className="mt-4 rounded bg-main-orange px-4 py-2 text-white hover:bg-orange-500" onClick={onDelete}>
            Delete
          </button>
          <button className="mt-4 rounded bg-main-orange px-4 py-2 text-white hover:bg-orange-500" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteButtonModal;
