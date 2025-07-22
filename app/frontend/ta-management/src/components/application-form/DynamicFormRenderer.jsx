import React, { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorMessage from "@/components/ErrorMessage";
import RankSelect from "@/components/ui/RankSelect2";

const DynamicFormRenderer = ({
  template,
  responses = {},
  setResponses,
  dynamicResponses = {},
  setDynamicResponses,
  errors = {},
  currentSection = null,
  fieldMapping = {},
  termDetails = {}, // New prop for term details
}) => {
  const [localResponses, setLocalResponses] = useState(responses);
  const [localDynamicResponses, setLocalDynamicResponses] =
    useState(dynamicResponses);

  useEffect(() => {
    setLocalResponses(responses);
  }, [responses]);

  useEffect(() => {
    setLocalDynamicResponses(dynamicResponses);
  }, [dynamicResponses]);

  const handleResponseChange = useCallback(
    (fieldName, value) => {
      // Check if this field exists in default responses
      const shouldUseDefaultResponses = fieldMapping[fieldName] === true;

      if (shouldUseDefaultResponses) {
        // Store in default responses
        const newResponses = { ...localResponses, [fieldName]: value };
        setLocalResponses(newResponses);
        setResponses?.(newResponses);
        console.log("Updated default resp", newResponses);
      } else {
        // Store in dynamic responses
        const newDynamicResponses = {
          ...localDynamicResponses,
          [fieldName]: value,
        };
        setLocalDynamicResponses(newDynamicResponses);
        setDynamicResponses?.(newDynamicResponses);
        console.log("Updated dynamic resp", newDynamicResponses);
      }
    },
    [
      localResponses,
      localDynamicResponses,
      setResponses,
      setDynamicResponses,
      fieldMapping,
    ]
  );

  const renderQuestion = (question) => {
    const {
      question_id,
      question_text,
      question_type,
      field_name,
      is_required,
      help_text,
      options = [],
      validation_rules = {},
    } = question;

    //if field_name == termSelection, use the term details from the parent component

    // Transform options to consistent array format
    let normalizedOptions = [];

    // Special handling for termSelection field - use termDetails from props
    if (
      field_name === "termSelection" &&
      termDetails &&
      Array.isArray(termDetails) &&
      termDetails.length > 0
    ) {
      console.log("Using termDetails for termSelection:", termDetails);
      normalizedOptions = termDetails;
    } else if (Array.isArray(options)) {
      // Already in correct format
      normalizedOptions = options;
    } else if (typeof options === "object" && options !== null) {
      // Convert object to array format
      normalizedOptions = Object.entries(options).map(([key, value]) => ({
        value: key,
        label: value,
      }));
    }

    // Get value from appropriate responses object
    const shouldUseDefaultResponses = fieldMapping[field_name] === true;
    const value = shouldUseDefaultResponses
      ? localResponses[field_name] || ""
      : localDynamicResponses[field_name] || "";

    // Debug value retrieval
    // console.log(`Getting value for ${field_name}:`, {
    //   shouldUseDefaultResponses,
    //   valueFromDefault: localResponses[field_name],
    //   valueFromDynamic: localDynamicResponses[field_name],
    //   finalValue: value,
    // });

    const error = errors[field_name];

    const questionLabel = (
      <Label
        className={`block mb-2 text-lg font-semibold ${
          is_required ? "required" : ""
        }`}
      >
        {question_text}
        {is_required && <span className="text-red-500 ml-1">*</span>}
      </Label>
    );

    const helpTextElement = help_text && (
      <p className="text-sm text-muted-foreground mb-2">{help_text}</p>
    );

    switch (question_type) {
      case "radio":
        return (
          <div key={question_id} className="mb-6">
            {questionLabel}
            {helpTextElement}
            <RadioGroup
              value={value}
              onValueChange={(val) => handleResponseChange(field_name, val)}
            >
              {normalizedOptions.map((option) => (
                <Label key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem value={option.value} />
                  {option.label}
                </Label>
              ))}
            </RadioGroup>
            <ErrorMessage error={error} />
          </div>
        );

      case "checkbox":
        return (
          <div key={question_id} className="mb-6">
            {questionLabel}
            {helpTextElement}
            <div className="space-y-2">
              {normalizedOptions.map((option) => {
                const isChecked = Array.isArray(value)
                  ? value.includes(option.value)
                  : false;
                return (
                  <Label key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (checked) {
                          handleResponseChange(field_name, [
                            ...currentValues,
                            option.value,
                          ]);
                        } else {
                          handleResponseChange(
                            field_name,
                            currentValues.filter((v) => v !== option.value)
                          );
                        }
                      }}
                    />
                    {option.label}
                  </Label>
                );
              })}
            </div>
            <ErrorMessage error={error} />
          </div>
        );

      case "select":
        return (
          <div key={question_id} className="mb-6">
            {questionLabel}
            {helpTextElement}
            <Select
              value={value}
              onValueChange={(val) => handleResponseChange(field_name, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {normalizedOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ErrorMessage error={error} />
          </div>
        );

      case "text":
      case "email":
        return (
          <div key={question_id} className="mb-6">
            {questionLabel}
            {helpTextElement}
            <Input
              type={question_type}
              value={value}
              onChange={(e) => handleResponseChange(field_name, e.target.value)}
              placeholder={validation_rules?.placeholder || ""}
              maxLength={validation_rules?.maxLength}
              minLength={validation_rules?.minLength}
            />
            <ErrorMessage error={error} />
          </div>
        );

      case "number":
        return (
          <div key={question_id} className="mb-6">
            {questionLabel}
            {helpTextElement}
            <Input
              type="number"
              value={value}
              onChange={(e) => handleResponseChange(field_name, e.target.value)}
              min={validation_rules?.min}
              max={validation_rules?.max}
              step={validation_rules?.step}
              placeholder={validation_rules?.placeholder || ""}
            />
            <ErrorMessage error={error} />
          </div>
        );

      case "textarea":
        return (
          <div key={question_id} className="mb-6">
            {questionLabel}
            {helpTextElement}
            <Textarea
              value={value}
              onChange={(e) => handleResponseChange(field_name, e.target.value)}
              placeholder={validation_rules?.placeholder || ""}
              rows={validation_rules?.rows || 3}
              maxLength={validation_rules?.maxLength}
            />
            <ErrorMessage error={error} />
          </div>
        );

      case "file":
        return (
          <div key={question_id} className="mb-6">
            {questionLabel}
            {helpTextElement}
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleResponseChange(field_name, {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    file: file,
                  });
                }
              }}
              accept={validation_rules?.accept}
              multiple={validation_rules?.multiple}
            />
            <ErrorMessage error={error} />
          </div>
        );

      case "ranking":
        return (
          <div key={question_id} className="mb-6">
            {questionLabel}
            {helpTextElement}
            <RankingComponent
              options={normalizedOptions}
              value={value}
              onChange={(val) => handleResponseChange(field_name, val)}
              maxRanks={validation_rules?.maxRanks || normalizedOptions.length}
            />
            <ErrorMessage error={error} />
          </div>
        );

      default:
        return (
          <div key={question_id} className="mb-6">
            <p className="text-red-500">
              Unknown question type: {question_type}
            </p>
          </div>
        );
    }
  };

  const renderSection = (section) => {
    if (currentSection && section.section_id !== currentSection) {
      return null;
    }

    return (
      <div className="space-y-8 col-span-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {section.name}
            {section.is_required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </h2>
          {section.description && (
            <p className="text-muted-foreground">{section.description}</p>
          )}
        </div>
        <div>
          {section.questions
            .sort((a, b) => a.order - b.order)
            .map(renderQuestion)}
        </div>
      </div>
    );
  };

  if (!template || !template.sections) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No form template available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {template.sections
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <div
            key={section.section_id || section.id || `section-${section.order}`}
          >
            {renderSection(section)}
          </div>
        ))}
    </div>
  );
};

// Fixed ranking component using the RankSelect component - no infinite loops
const RankingComponent = ({ options, value, onChange, maxRanks }) => {
  const [rankings, setRankings] = useState(() => value || {});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize rankings from value prop only once
  useEffect(() => {
    if (!isInitialized && value) {
      setRankings(value);
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  const updateRank = useCallback(
    (rankKey, optionValue) => {
      const newRankings = { ...rankings };

      // If empty string (cleared), remove the ranking
      if (!optionValue) {
        delete newRankings[rankKey];
      } else {
        // Remove the option from any existing rank first
        Object.keys(newRankings).forEach((key) => {
          if (newRankings[key] === optionValue) {
            delete newRankings[key];
          }
        });

        // Set the new ranking
        newRankings[rankKey] = optionValue;
      }

      // Update local state first
      setRankings(newRankings);

      // Then call onChange - this should only happen from user interaction
      if (onChange) {
        onChange(newRankings);
      }
    },
    [rankings, onChange]
  );

  // Convert normalized options back to simple array for RankSelect
  const simpleOptions = options.map(
    (option) => option.value || option.label || option
  );

  return (
    <div className="space-y-4">
      {Array.from({ length: maxRanks }, (_, index) => {
        const rankKey = `rank${index + 1}`;
        const label = `${index + 1}${["st", "nd", "rd"][index] || "th"} Choice`;

        return (
          <RankSelect
            key={rankKey}
            label={label}
            rankKey={rankKey}
            options={simpleOptions}
            currentRankings={rankings}
            onRankChange={updateRank}
            placeholder={`Select ${label.toLowerCase()}`}
          />
        );
      })}
    </div>
  );
};

export default DynamicFormRenderer;
