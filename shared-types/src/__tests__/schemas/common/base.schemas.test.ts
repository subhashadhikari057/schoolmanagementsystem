/**
 * =============================================================================
 * Base Schemas Test Suite
 * =============================================================================
 * Comprehensive tests for centralized base validation schemas.
 * =============================================================================
 */

import { z } from "zod";
import {
  UuidSchema,
  EmailSchema,
  PhoneSchema,
  PasswordSchema,
  NameSchema,
  TextContentSchema,
  ShortTextSchema,
  UrlSchema,
  DateStringSchema,
  DateTimeStringSchema,
  SlugSchema,
  BaseEntitySchema,
  AuditFieldsSchema,
  MetadataSchema,
  PaginationRequestSchema,
  PaginationMetaSchema,
  ErrorResponseSchema,
  createSuccessResponseSchema,
  createPaginatedResponseSchema,
  formatValidationErrors,
  validateWithFormattedErrors,
  SchemaUtils,
  CommonValidation,
} from "../../../schemas/common/base.schemas";

describe("Base Validation Schemas", () => {
  describe("Primitive Validation Schemas", () => {
    describe("UuidSchema", () => {
      test("should validate valid UUIDs", () => {
        const validUuids = [
          "123e4567-e89b-12d3-a456-426614174000",
          "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        ];

        validUuids.forEach((uuid) => {
          expect(() => UuidSchema.parse(uuid)).not.toThrow();
          expect(UuidSchema.parse(uuid)).toBe(uuid);
        });
      });

      test("should reject invalid UUIDs", () => {
        const invalidUuids = [
          "not-a-uuid",
          "123e4567-e89b-12d3-a456",
          "123e4567-e89b-12d3-a456-426614174000-extra",
          "",
          "123",
        ];

        invalidUuids.forEach((uuid) => {
          expect(() => UuidSchema.parse(uuid)).toThrow();
        });
      });
    });

    describe("EmailSchema", () => {
      test("should validate valid emails", () => {
        const validEmails = [
          "test@example.com",
          "user.name+tag@domain.co.uk",
          "test123@test-domain.com",
          "a@b.co",
        ];

        validEmails.forEach((email) => {
          expect(() => EmailSchema.parse(email)).not.toThrow();
          expect(EmailSchema.parse(email)).toBe(email);
        });
      });

      test("should reject invalid emails", () => {
        const invalidEmails = [
          "not-an-email",
          "@domain.com",
          "user@",
          "user@.com",
          "",
          "a".repeat(256) + "@domain.com", // Too long
        ];

        invalidEmails.forEach((email) => {
          expect(() => EmailSchema.parse(email)).toThrow();
        });
      });
    });

    describe("PhoneSchema", () => {
      test("should validate valid phone numbers", () => {
        const validPhones = [
          "+1234567890",
          "1234567890",
          "+919876543210",
          "9876543210",
          "+447911123456",
        ];

        validPhones.forEach((phone) => {
          expect(() => PhoneSchema.parse(phone)).not.toThrow();
        });
      });

      test("should reject invalid phone numbers", () => {
        const invalidPhones = [
          "123", // Too short
          "+123456789012345678", // Too long
          "not-a-phone",
          "+0123456789", // Starts with 0 after +
          "",
        ];

        invalidPhones.forEach((phone) => {
          expect(() => PhoneSchema.parse(phone)).toThrow();
        });
      });
    });

    describe("PasswordSchema", () => {
      test("should validate strong passwords", () => {
        const validPasswords = [
          "Password123",
          "MyStr0ngP@ss",
          "Test123456",
          "Complex1Pass",
        ];

        validPasswords.forEach((password) => {
          expect(() => PasswordSchema.parse(password)).not.toThrow();
        });
      });

      test("should reject weak passwords", () => {
        const invalidPasswords = [
          "weak", // Too short
          "password", // No uppercase or number
          "PASSWORD", // No lowercase or number
          "12345678", // No letters
          "Pass123", // Too short
          "a".repeat(129), // Too long
        ];

        invalidPasswords.forEach((password) => {
          expect(() => PasswordSchema.parse(password)).toThrow();
        });
      });
    });

    describe("NameSchema", () => {
      test("should validate valid names", () => {
        const validNames = [
          "John Doe",
          "Mary-Jane Smith",
          "O'Connor",
          "Dr. Smith Jr.",
          "Jean-Claude",
        ];

        validNames.forEach((name) => {
          expect(() => NameSchema.parse(name)).not.toThrow();
        });
      });

      test("should reject invalid names", () => {
        const invalidNames = [
          "", // Empty
          "John123", // Contains numbers
          "John@Doe", // Contains special characters
          "a".repeat(101), // Too long
        ];

        invalidNames.forEach((name) => {
          expect(() => NameSchema.parse(name)).toThrow();
        });
      });
    });

    describe("DateStringSchema", () => {
      test("should validate valid date strings", () => {
        const validDates = [
          "2023-01-01",
          "2023-12-31",
          "2024-02-29", // Leap year
        ];

        validDates.forEach((date) => {
          expect(() => DateStringSchema.parse(date)).not.toThrow();
        });
      });

      test("should reject invalid date strings", () => {
        const invalidDates = [
          "2023-1-1", // Wrong format
          "01-01-2023", // Wrong format
          "2023/01/01", // Wrong format
          "not-a-date",
          "",
        ];

        invalidDates.forEach((date) => {
          expect(() => DateStringSchema.parse(date)).toThrow();
        });
      });
    });

    describe("SlugSchema", () => {
      test("should validate valid slugs", () => {
        const validSlugs = [
          "hello-world",
          "test-123",
          "my-awesome-post",
          "simple",
        ];

        validSlugs.forEach((slug) => {
          expect(() => SlugSchema.parse(slug)).not.toThrow();
        });
      });

      test("should reject invalid slugs", () => {
        const invalidSlugs = [
          "Hello-World", // Contains uppercase
          "hello_world", // Contains underscore
          "hello world", // Contains space
          "hello@world", // Contains special character
          "", // Empty
          "a".repeat(101), // Too long
        ];

        invalidSlugs.forEach((slug) => {
          expect(() => SlugSchema.parse(slug)).toThrow();
        });
      });
    });
  });

  describe("Entity Validation Schemas", () => {
    describe("BaseEntitySchema", () => {
      test("should validate complete base entity", () => {
        const validEntity = {
          id: "123e4567-e89b-12d3-a456-426614174000",
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        };

        expect(() => BaseEntitySchema.parse(validEntity)).not.toThrow();
      });

      test("should validate base entity without deleted_at", () => {
        const validEntity = {
          id: "123e4567-e89b-12d3-a456-426614174000",
          created_at: new Date(),
          updated_at: new Date(),
        };

        expect(() => BaseEntitySchema.parse(validEntity)).not.toThrow();
      });

      test("should reject invalid base entity", () => {
        const invalidEntity = {
          id: "not-a-uuid",
          created_at: "not-a-date",
          updated_at: new Date(),
        };

        expect(() => BaseEntitySchema.parse(invalidEntity)).toThrow();
      });
    });

    describe("PaginationRequestSchema", () => {
      test("should validate valid pagination request", () => {
        const validPagination = {
          page: 1,
          limit: 10,
          sortBy: "name",
          sortOrder: "asc" as const,
        };

        expect(() =>
          PaginationRequestSchema.parse(validPagination),
        ).not.toThrow();
      });

      test("should apply defaults for missing fields", () => {
        const minimalPagination = {};
        const result = PaginationRequestSchema.parse(minimalPagination);

        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
        expect(result.sortOrder).toBe("asc");
      });

      test("should coerce string numbers", () => {
        const paginationWithStrings = {
          page: "2",
          limit: "20",
        };

        const result = PaginationRequestSchema.parse(paginationWithStrings);
        expect(result.page).toBe(2);
        expect(result.limit).toBe(20);
      });

      test("should reject invalid pagination values", () => {
        const invalidCases = [
          { page: 0 }, // Page must be at least 1
          { limit: 0 }, // Limit must be at least 1
          { limit: 201 }, // Limit cannot exceed 200
          { sortOrder: "invalid" }, // Invalid sort order
        ];

        invalidCases.forEach((invalidCase) => {
          expect(() => PaginationRequestSchema.parse(invalidCase)).toThrow();
        });
      });
    });
  });

  describe("Response Schemas", () => {
    describe("createSuccessResponseSchema", () => {
      test("should create valid success response schema", () => {
        const dataSchema = z.object({ name: z.string() });
        const successSchema = createSuccessResponseSchema(dataSchema);

        const validResponse = {
          success: true,
          data: { name: "Test" },
          statusCode: 200,
        };

        expect(() => successSchema.parse(validResponse)).not.toThrow();
      });

      test("should reject invalid success response", () => {
        const dataSchema = z.object({ name: z.string() });
        const successSchema = createSuccessResponseSchema(dataSchema);

        const invalidResponse = {
          success: false, // Should be true
          data: { name: "Test" },
          statusCode: 200,
        };

        expect(() => successSchema.parse(invalidResponse)).toThrow();
      });
    });

    describe("ErrorResponseSchema", () => {
      test("should validate complete error response", () => {
        const validError = {
          success: false,
          statusCode: 400,
          error: "Validation Error",
          message: "Request validation failed",
          code: "VALIDATION_FAILED",
          traceId: "trace-123",
          errors: { field: ["Error message"] },
        };

        expect(() => ErrorResponseSchema.parse(validError)).not.toThrow();
      });

      test("should validate minimal error response", () => {
        const minimalError = {
          success: false,
          statusCode: 500,
          error: "Internal Server Error",
          message: "Something went wrong",
        };

        expect(() => ErrorResponseSchema.parse(minimalError)).not.toThrow();
      });
    });

    describe("createPaginatedResponseSchema", () => {
      test("should create valid paginated response schema", () => {
        const itemSchema = z.object({ id: z.string(), name: z.string() });
        const paginatedSchema = createPaginatedResponseSchema(itemSchema);

        const validResponse = {
          data: [
            { id: "1", name: "Item 1" },
            { id: "2", name: "Item 2" },
          ],
          meta: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        };

        expect(() => paginatedSchema.parse(validResponse)).not.toThrow();
      });
    });
  });

  describe("Validation Utilities", () => {
    describe("formatValidationErrors", () => {
      test("should format Zod errors correctly", () => {
        const schema = z.object({
          name: z.string().min(1),
          email: z.string().email(),
        });

        const result = schema.safeParse({
          name: "",
          email: "invalid-email",
        });

        if (!result.success) {
          const formattedErrors = formatValidationErrors(result.error);

          expect(formattedErrors).toHaveProperty("name");
          expect(formattedErrors).toHaveProperty("email");
          expect(Array.isArray(formattedErrors.name)).toBe(true);
          expect(Array.isArray(formattedErrors.email)).toBe(true);
        }
      });
    });

    describe("validateWithFormattedErrors", () => {
      test("should return success for valid data", () => {
        const schema = z.object({ name: z.string() });
        const result = validateWithFormattedErrors(schema, { name: "Test" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({ name: "Test" });
        }
      });

      test("should return formatted errors for invalid data", () => {
        const schema = z.object({ name: z.string().min(1) });
        const result = validateWithFormattedErrors(schema, { name: "" });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toHaveProperty("name");
          expect(Array.isArray(result.errors.name)).toBe(true);
        }
      });
    });

    describe("SchemaUtils", () => {
      const testSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        age: z.number(),
      });

      test("should create partial schema", () => {
        const partialSchema = SchemaUtils.partial(testSchema);
        const result = partialSchema.parse({ name: "Test" });

        expect(result).toEqual({ name: "Test" });
      });

      test("should create pick schema", () => {
        const pickSchema = SchemaUtils.pick(testSchema, ["name", "email"]);
        const result = pickSchema.parse({
          name: "Test",
          email: "test@example.com",
        });

        expect(result).toEqual({ name: "Test", email: "test@example.com" });
      });

      test("should create omit schema", () => {
        const omitSchema = SchemaUtils.omit(testSchema, ["id", "age"]);
        const result = omitSchema.parse({
          name: "Test",
          email: "test@example.com",
        });

        expect(result).toEqual({ name: "Test", email: "test@example.com" });
      });

      test("should merge schemas", () => {
        const schema1 = z.object({ name: z.string() });
        const schema2 = z.object({ age: z.number() });
        const mergedSchema = SchemaUtils.merge(schema1, schema2);

        const result = mergedSchema.parse({ name: "Test", age: 25 });
        expect(result).toEqual({ name: "Test", age: 25 });
      });

      test("should extend schema", () => {
        const baseSchema = z.object({ name: z.string() });
        const extendedSchema = SchemaUtils.extend(baseSchema, {
          age: z.number(),
        });

        const result = extendedSchema.parse({ name: "Test", age: 25 });
        expect(result).toEqual({ name: "Test", age: 25 });
      });
    });

    describe("CommonValidation", () => {
      test("should provide all common validation patterns", () => {
        expect(CommonValidation.uuid).toBeDefined();
        expect(CommonValidation.email).toBeDefined();
        expect(CommonValidation.phone).toBeDefined();
        expect(CommonValidation.password).toBeDefined();
        expect(CommonValidation.name).toBeDefined();
        expect(CommonValidation.text).toBeDefined();
        expect(CommonValidation.shortText).toBeDefined();
        expect(CommonValidation.url).toBeDefined();
        expect(CommonValidation.dateString).toBeDefined();
        expect(CommonValidation.dateTimeString).toBeDefined();
        expect(CommonValidation.slug).toBeDefined();
        expect(CommonValidation.metadata).toBeDefined();
        expect(CommonValidation.pagination).toBeDefined();
      });

      test("should work with all validation patterns", () => {
        const testData = {
          uuid: "123e4567-e89b-12d3-a456-426614174000",
          email: "test@example.com",
          phone: "+1234567890",
          password: "Password123",
          name: "John Doe",
          text: "This is some text content",
          shortText: "Short text",
          url: "https://example.com",
          dateString: "2023-01-01",
          dateTimeString: "2023-01-01T00:00:00.000Z",
          slug: "test-slug",
          metadata: { key: "value" },
        };

        // Test each validation pattern
        expect(() => CommonValidation.uuid.parse(testData.uuid)).not.toThrow();
        expect(() =>
          CommonValidation.email.parse(testData.email),
        ).not.toThrow();
        expect(() =>
          CommonValidation.phone.parse(testData.phone),
        ).not.toThrow();
        expect(() =>
          CommonValidation.password.parse(testData.password),
        ).not.toThrow();
        expect(() => CommonValidation.name.parse(testData.name)).not.toThrow();
        expect(() => CommonValidation.text.parse(testData.text)).not.toThrow();
        expect(() =>
          CommonValidation.shortText.parse(testData.shortText),
        ).not.toThrow();
        expect(() => CommonValidation.url.parse(testData.url)).not.toThrow();
        expect(() =>
          CommonValidation.dateString.parse(testData.dateString),
        ).not.toThrow();
        expect(() =>
          CommonValidation.dateTimeString.parse(testData.dateTimeString),
        ).not.toThrow();
        expect(() => CommonValidation.slug.parse(testData.slug)).not.toThrow();
        expect(() =>
          CommonValidation.metadata.parse(testData.metadata),
        ).not.toThrow();
      });
    });
  });
});
