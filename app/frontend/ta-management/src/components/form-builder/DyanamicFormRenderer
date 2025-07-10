import React, { useState, useEffect } from "react";
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
import RankSelect from "@/components/ui/RankSelect";

const DynamicFormRenderer = ({
  template,
  responses = {},
  setResponses,
  errors = {},
  currentSection = null, // If null, render all sections
}) => {
  const [localResponses, setLocalResponses] = useState(responses);

  useEffect(() => {
    setLocalResponses(responses);
  }, [responses]);

  const handleResponseChange = (fieldName, value) => {
    const newResponses = { ...localResponses, [fieldName]: value };
    setLocalResponses(newResponses);
    setResponses?.(newResponses);
  };

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

    const value = localResponses[field_name] || "";
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
              {options.map((option) => (
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
              {options.map((option) => {
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
                {options.map((option) => (
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
              placeholder={validation_rules.placeholder || ""}
              maxLength={validation_rules.maxLength}
              minLength={validation_rules.minLength}
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
              min={validation_rules.min}
              max={validation_rules.max}
              step={validation_rules.step}
              placeholder={validation_rules.placeholder || ""}
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
              placeholder={validation_rules.placeholder || ""}
              rows={validation_rules.rows || 3}
              maxLength={validation_rules.maxLength}
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
              accept={validation_rules.accept}
              multiple={validation_rules.multiple}
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
              options={options}
              value={value}
              onChange={(val) => handleResponseChange(field_name, val)}
              maxRanks={validation_rules.maxRanks || options.length}
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
      <Card key={section.section_id} className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            {section.name}
            {section.is_required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </CardTitle>
          {section.description && (
            <p className="text-muted-foreground">{section.description}</p>
          )}
        </CardHeader>
        <CardContent>
          {section.questions
            .sort((a, b) => a.order - b.order)
            .map(renderQuestion)}
        </CardContent>
      </Card>
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
      {template.sections.sort((a, b) => a.order - b.order).map(renderSection)}
    </div>
  );
};

// Custom ranking component for handling discipline rankings
const RankingComponent = ({ options, value, onChange, maxRanks }) => {
  const [rankings, setRankings] = useState(value || {});

  useEffect(() => {
    onChange(rankings);
  }, [rankings]);

  const updateRank = (rank, optionValue) => {
    const newRankings = { ...rankings };

    // Remove the option from any existing rank
    Object.keys(newRankings).forEach((key) => {
      if (newRankings[key] === optionValue) {
        delete newRankings[key];
      }
    });

    // Add to new rank
    if (optionValue) {
      newRankings[rank] = optionValue;
    }

    setRankings(newRankings);
  };

  const getAvailableOptions = (currentRank) => {
    const usedValues = Object.entries(rankings)
      .filter(([rank, value]) => rank !== currentRank && value)
      .map(([rank, value]) => value);

    return options.filter((option) => !usedValues.includes(option.value));
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: maxRanks }, (_, index) => {
        const rank = `rank${index + 1}`;
        const availableOptions = getAvailableOptions(rank);

        return (
          <div key={rank}>
            <Label className="block mb-2">{index + 1}. Choice</Label>
            <Select
              value={rankings[rank] || ""}
              onValueChange={(val) => updateRank(rank, val)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={`Select ${index + 1}${
                    ["st", "nd", "rd"][index] || "th"
                  } choice`}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Clear selection</SelectItem>
                {availableOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
};

export default DynamicFormRenderer;
