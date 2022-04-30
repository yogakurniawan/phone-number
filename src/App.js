import React, { useState, useEffect } from "react";

function App() {
  const [inputType, setInputType] = useState("text");
  const [value, setValue] = useState("");
  const inputTel = React.createRef();
  const inputText = React.createRef();
  const handleChange = (e) => {
    const theValue = (e.target.value || '').trim();
    if (isNaN(theValue) || theValue === '') {
      setInputType("text");
    } else {
      setInputType("tel");
    }
    setValue(theValue);
  };

  useEffect(() => {
    if (inputType === "tel") {
      inputTel.current.focus();
    } else {
      inputText.current.focus();
    }
  }, [inputType]);

  return (
    <>
      {inputType === "tel" && (
        <input
          ref={inputTel}
          name="phone input"
          type="tel"
          value={value}
          onChange={handleChange}
        />
      )}
      {inputType === "text" && (
        <input
          ref={inputText}
          name="phone input"
          value={value}
          type="text"
          onChange={handleChange}
        />
      )}
    </>
  );
}

export default App;
