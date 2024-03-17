import React from "react";

interface TreatmentButtonModalProps {
  isOpen: boolean;
  treatment: { treatmentID: number; category: string; type: string[]; date: string; comments: string };
  onClose: () => void;
}

const CreateButtonModal: React.FC<TreatmentButtonModalProps> = ({ isOpen, treatment, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-full w-full items-center justify-center overflow-y-auto bg-gray-600 bg-opacity-50 text-normal">
      <div className=" flex w-[38%] flex-col rounded-lg bg-white p-4 shadow-md">
        <div className="flex justify-center">
          <h1 className="mb-3 text-3xl font-semibold">Treatment</h1>
        </div>
        <div className="flex flex-col justify-start">
          <span>
            Treatment ID: <span>{treatment.treatmentID}</span>
          </span>
          <span>
            Category: <span>{treatment.category}</span>
          </span>
          <span>
            Type: <span>{treatment.type.map((type) => type).join("; ")}</span>
          </span>
          <span>
            Date: <span>{treatment.date}</span>
          </span>
          <span>
            Comments: <span>{treatment.comments}</span>
          </span>
        </div>

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
