import { z } from "zod"

export const registration = z.object({
    username: z.string().min(2, "Please Enter Valid username"),
    password: z.string().min(2, "Please Enter Valid password"),
    pharmacy_name: z.string().min(2, "Please Enter Valid pharmacy name"),
    role: z.enum(["Manager", "Pharmacist"], {message: "Please Select valid role"}),
    logoUrl: z.string().min(2, "Please Enter Valid logo url"),
    pharmacy_tin: z.string().min(2, "Please Enter Valid TIN")
})

export const login = z.object({
    username: z.string().min(2, "Please Enter registered username"),
    password: z.string().min(2, "Please Enter registered password")
})

export const addMedicine = z.object({
    name: z.string().min(2, "Please Enter Valid medicine name"),
    category: z.string().min(1, "Please select a category"),
    price: z.number().positive("Price must be a positive number"),
    cost: z.number().nonnegative("Cost must be a number"),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    batch_number: z.string().min(2, "Please Enter Valid batch number"),
    expiry_date: z
      .union([z.string().min(1, "Please select expiry date"), z.date()])
      .optional()
      .nullable(),
    description: z.string().min(2, "Please Enter Valid description"),
    supplier_id: z.string().min(1, "Please Select a supplier")
})

export const purchase = z.object({
    medicine_name: z.string().min(2, "Please Enter Valid medicine name"),
    quantity: z.coerce.number().int().positive("Quantity must be a positive integer"),
    price: z.coerce.number().positive("Price must be a positive number")
})

export const saleCart = z.object({
  items: z
    .array(
      z.object({
        medicine_name: z.string().min(2, "Please Enter Valid medicine name"),
        quantity: z.coerce.number().int().positive("Quantity must be a positive integer"),
        price: z.coerce.number().positive("Price must be a positive number"),
      }),
    )
    .min(1, "Add at least one medicine"),
})

export const changePassword = z.object({
    old_password: z.string().min(1, "Please enter the old password"),
    new_password: z.string().min(2, "Please enter a new password"),
})

export const changePasswordWithConfirm = z
  .object({
    old_password: z.string().min(1, "Please enter the old password"),
    new_password: z.string().min(2, "Please enter a new password"),
    confirm_new_password: z.string().min(2, "Please confirm the new password"),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: "Passwords do not match",
    path: ["confirm_new_password"],
  })

export const addSupplier = z.object({
  supplier_name: z.string().min(2, "Please Enter a supplier name"),
  supplier_phone: z.string().min(2, "Please Enter Valid phone number"),
  supplier_email: z.string().email("Please Enter valid Email").optional().or(z.literal(""))
})

export const addInvoice = z.object({
  invoice_number: z.string().min(2, "Please Enter a invoice number"),
  supplier_id: z.string().min(1, "Please Select a supplier"),
  invoice_date: z.union([z.date(), z.string().min(1, "Please Enter a invoice date")]),
  invoice_amount: z.number().positive("Please Enter a valid invoice amount"),
  invoice_status: z.enum(["paid", "unpaid"], {message: "Please Select valid invoice status"}),
  invoice_type: z.enum(["purchase", "sale"], {message: "Please Select valid invoice type"}),
  invoice_payment_method: z.enum(["Cash", "Bank", "Credit"], {message: "Please Select valid invoice payment method"}),
  invoice_image: z.string().url("Please Enter a valid invoice image URL").optional().or(z.literal("")),
})

export const addCashout = z.object({
  amount: z.number().positive("Please enter a valid cashout amount"),
  reason: z.string().min(2, "Please enter a clear reason"),
})
