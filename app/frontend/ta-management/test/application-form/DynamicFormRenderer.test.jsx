import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DynamicFormRenderer from "@/components/application-form/DynamicFormRenderer";

//–– Mock all of the shadcn/ui and ErrorMessage imports to simple HTML elements ––
vi.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }) => <label {...props}>{children}</label>,
}));
vi.mock("@/components/ui/radio-group", () => {
  const React = require("react");
  const { Children, cloneElement, isValidElement } = React;

  function wireRadios(children, value, onValueChange) {
    return Children.map(children, (child) => {
      if (!isValidElement(child)) return child;
      // Dive into the child's children
      const newChildren = Children.map(child.props.children, (inner) => {
        if (
          isValidElement(inner) &&
          inner.type === "input" &&
          inner.props.type === "radio"
        ) {
          return cloneElement(inner, {
            checked: inner.props.value === value,
            onChange: () => onValueChange(inner.props.value),
          });
        }
        return inner;
      });
      return cloneElement(child, { ...child.props }, newChildren);
    });
  }

  return {
    RadioGroup: ({ children, value, onValueChange }) => (
      <div>{wireRadios(children, value, onValueChange)}</div>
    ),
    RadioGroupItem: (props) => <input type="radio" {...props} />,
  };
});
vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      {...props}
    />
  ),
}));
vi.mock("@/components/ui/input", () => ({
  Input: (props) => <input {...props} />,
}));
vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props) => <textarea {...props} />,
}));
vi.mock("@/components/ErrorMessage", () => ({
  default: ({ error }) =>
    error ? <div data-testid="error">{error}</div> : null,
}));
vi.mock("@/components/ui/select", () => {
  const React = require("react");
  return {
    Select: ({ value, onValueChange, children }) => (
      <select
        data-testid="select"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    ),
    SelectTrigger: ({ children }) => <>{children}</>,
    SelectValue: ({ children, placeholder }) => <>{children || placeholder}</>,
    SelectContent: ({ children }) => <>{children}</>,
    SelectItem: ({ value, children }) => (
      <option value={value}>{children}</option>
    ),
  };
});

describe("DynamicFormRenderer", () => {
  it("shows fallback when no template provided", () => {
    render(<DynamicFormRenderer template={null} />);
    expect(screen.getByText("No form template available")).toBeInTheDocument();
  });

  it("renders a text input and calls setResponses on change", () => {
    const setResponses = vi.fn();
    const question = {
      question_id: "q1",
      question_text: "Your name",
      question_type: "text",
      field_name: "name",
      is_required: true,
      help_text: "Enter full name",
      options: [],
      validation_rules: { placeholder: "Name here" },
      order: 1,
    };
    const template = {
      sections: [
        {
          section_id: "s1",
          name: "Info",
          description: "",
          is_required: false,
          order: 1,
          questions: [question],
        },
      ],
    };

    render(
      <DynamicFormRenderer
        template={template}
        responses={{}}
        setResponses={setResponses}
        dynamicResponses={{}}
        setDynamicResponses={() => {}}
        fieldMapping={{ name: true }}
      />
    );

    const input = screen.getByPlaceholderText("Name here");
    fireEvent.change(input, { target: { value: "Alice" } });
    expect(setResponses).toHaveBeenCalledWith({ name: "Alice" });
  });

  it("renders a checkbox list and updates dynamicResponses", () => {
    const setDynamic = vi.fn();
    const question = {
      question_id: "q3",
      question_text: "Pick many",
      question_type: "checkbox",
      field_name: "multi",
      is_required: false,
      options: [
        { value: "x", label: "X" },
        { value: "y", label: "Y" },
      ],
      order: 1,
    };
    const template = {
      sections: [
        {
          section_id: "s1",
          name: "Multi",
          description: "",
          is_required: false,
          order: 1,
          questions: [question],
        },
      ],
    };

    render(
      <DynamicFormRenderer
        template={template}
        responses={{}}
        setResponses={() => {}}
        dynamicResponses={{}}
        setDynamicResponses={setDynamic}
        fieldMapping={{}}
      />
    );

    const checkboxX = screen.getByLabelText("X");
    fireEvent.click(checkboxX);
    expect(setDynamic).toHaveBeenCalledWith({ multi: ["x"] });
  });

  it("renders a number input and calls setResponses", () => {
    const setResponses = vi.fn();
    const question = {
      question_id: "q4",
      question_text: "Enter age",
      question_type: "number",
      field_name: "age",
      is_required: false,
      validation_rules: { placeholder: "0" },
      order: 1,
    };
    const template = {
      sections: [
        {
          section_id: "s1",
          name: "Numbers",
          description: "",
          is_required: false,
          order: 1,
          questions: [question],
        },
      ],
    };

    render(
      <DynamicFormRenderer
        template={template}
        responses={{}}
        setResponses={setResponses}
        dynamicResponses={{}}
        setDynamicResponses={() => {}}
        fieldMapping={{ age: true }}
      />
    );

    const numInput = screen.getByPlaceholderText("0");
    fireEvent.change(numInput, { target: { value: "42" } });
    expect(setResponses).toHaveBeenCalledWith({ age: "42" });
  });

  it("renders a textarea and calls setDynamicResponses", () => {
    const setDynamic = vi.fn();
    const question = {
      question_id: "q5",
      question_text: "Your bio",
      question_type: "textarea",
      field_name: "bio",
      is_required: false,
      validation_rules: { placeholder: "Tell us" },
      order: 1,
    };
    const template = {
      sections: [
        {
          section_id: "s1",
          name: "Text",
          description: "",
          is_required: false,
          order: 1,
          questions: [question],
        },
      ],
    };

    render(
      <DynamicFormRenderer
        template={template}
        responses={{}}
        setResponses={() => {}}
        dynamicResponses={{}}
        setDynamicResponses={setDynamic}
        fieldMapping={{}}
      />
    );

    const ta = screen.getByPlaceholderText("Tell us");
    fireEvent.change(ta, { target: { value: "Hello!" } });
    expect(setDynamic).toHaveBeenCalledWith({ bio: "Hello!" });
  });

  it("7. renders a select and calls setResponses", () => {
    const setResponses = vi.fn();
    const question = {
      question_id: "q6",
      question_text: "Pick one",
      question_type: "select",
      field_name: "sel",
      is_required: false,
      options: [
        { value: "o1", label: "One" },
        { value: "o2", label: "Two" },
      ],
      order: 1,
    };
    const template = {
      sections: [
        {
          section_id: "s1",
          name: "Select",
          description: "",
          is_required: false,
          order: 1,
          questions: [question],
        },
      ],
    };

    render(
      <DynamicFormRenderer
        template={template}
        responses={{}}
        setResponses={setResponses}
        dynamicResponses={{}}
        setDynamicResponses={() => {}}
        fieldMapping={{ sel: true }}
      />
    );

    const select = screen.getByTestId("select");
    fireEvent.change(select, { target: { value: "o2" } });
    expect(setResponses).toHaveBeenCalledWith({ sel: "o2" });
  });

  it("8. shows an error message when errors prop is passed", () => {
    const setResponses = vi.fn();
    const question = {
      question_id: "q7",
      question_text: "Error test",
      question_type: "text",
      field_name: "err",
      is_required: false,
      options: [],
      validation_rules: { placeholder: "Err" },
      order: 1,
    };
    const template = {
      sections: [
        {
          section_id: "s1",
          name: "Err",
          description: "",
          is_required: false,
          order: 1,
          questions: [question],
        },
      ],
    };

    render(
      <DynamicFormRenderer
        template={template}
        responses={{}}
        setResponses={setResponses}
        dynamicResponses={{}}
        setDynamicResponses={() => {}}
        fieldMapping={{ err: true }}
        errors={{ err: "Required field" }}
      />
    );

    expect(screen.getByTestId("error")).toHaveTextContent("Required field");
  });
});
