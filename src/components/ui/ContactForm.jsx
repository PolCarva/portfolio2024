import React, { useState, useEffect } from "react";
import { useForm, ValidationError } from "@formspree/react";

const ContactForm = () => {
  const [state, handleSubmit] = useForm("xpzedzvr");
  const [buttonText, setButtonText] = useState("Send message");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  useEffect(() => {
    if (state.succeeded) {
      setButtonText("Sent!");
      const timer = setTimeout(() => {
        setButtonText("Send message");
        setFormData({
          name: "",
          email: "",
          message: "",
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [state.succeeded]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} method="POST">
      <div className="flex flex-col gap-5">
        <label htmlFor="name">
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            className="w-full h-14 border-b-secondary border-b px-5 bg-transparent text-body font-grotesk text-xl placeholder:text-secondary-500"
          />
        </label>
        <ValidationError prefix="Name" field="name" errors={state.errors} />
        <label htmlFor="email">
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Your email"
            className="w-full h-14 border-b-secondary border-b px-5 bg-transparent text-body font-grotesk text-xl placeholder:text-secondary-500"
          />
        </label>
        <ValidationError prefix="Email" field="email" errors={state.errors} />
        <label htmlFor="message">
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Your message"
            className="w-full min-h-[4.5rem] max-h-52 border-b-secondary border-b p-5 bg-transparent text-body font-grotesk text-xl placeholder:text-secondary-500"
          ></textarea>
        </label>
        <ValidationError
          prefix="Message"
          field="message"
          errors={state.errors}
        />
        <button
          type="submit"
          disabled={state.submitting}
          className="w-full md:w-4/12 h-14 bg-secondary text-primary rounded-full font-medium uppercase hover:scale-95 transition text-xl"
        >
          {state.submitting ? "Sending..." : buttonText}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
