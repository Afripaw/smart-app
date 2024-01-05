import React, { useState } from "react";

const TextareaInput: React.FC = () => {
  const [text, setText] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  return (
    <textarea
      className="h-32 w-full overflow-auto rounded-md border border-gray-300 p-2"
      value={text}
      onChange={handleChange}
      placeholder="Enter your text here..."
    />
  );
};

export default TextareaInput;
