import { isValidObjectId, type FilterQuery } from 'mongoose';
import {
  expenseCategories,
  ExpenseCounterModel,
  ExpenseModel,
  type Expense,
  type ExpenseDocument,
} from '../models/expense.model.js';
import { VehicleModel } from '../models/vehicle.model.js';
import { HttpError } from '../utils/http-error.js';
import type { ExpenseInput } from '../validation/expense.validation.js';

export type List = {
  search?: string;
  vehicle?: string;
  category?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string;
  limit?: string;
};

export async function listExpenses(options: List) {
  const query = await filters(options);
  const pagination = page(options);
  const total = await ExpenseModel.countDocuments(query);
  const data = await ExpenseModel.find(query)
    .sort(sort(options.sort))
    .skip((pagination.page - 1) * pagination.limit)
    .limit(pagination.limit)
    .populate('vehicle');

  return {
    data: data.map(out),
    meta: { total, ...pagination, totalPages: Math.max(1, Math.ceil(total / pagination.limit)) },
  };
}

export async function getExpense(id: string) {
  return out(await populated(id));
}

export async function createExpense(input: ExpenseInput, userId: string) {
  await vehicle(input.vehicle);
  const expenseNumber = await number();
  return out(await (await ExpenseModel.create({ ...input, expenseNumber, createdBy: userId })).populate('vehicle'));
}

export async function updateExpense(id: string, input: Partial<ExpenseInput>) {
  const record = await ExpenseModel.findById(id);
  if (!record) throw new HttpError(404, 'Expense not found.');
  if (input.vehicle) await vehicle(input.vehicle);
  Object.assign(record, input);
  await record.save();
  return out(await record.populate('vehicle'));
}

export async function deleteExpense(id: string) {
  if (!(await ExpenseModel.findByIdAndDelete(id))) throw new HttpError(404, 'Expense not found.');
}

async function vehicle(id: string) {
  if (!(await VehicleModel.exists({ _id: id }))) throw new HttpError(400, 'Selected vehicle does not exist.');
}

async function filters(options: List): Promise<FilterQuery<Expense>> {
  const query: FilterQuery<Expense> = {};

  if (options.vehicle) {
    if (!isValidObjectId(options.vehicle)) throw new HttpError(400, 'vehicle is invalid.');
    query.vehicle = options.vehicle;
  }

  if (options.category) {
    if (!expenseCategories.includes(options.category as Expense['category'])) {
      throw new HttpError(400, 'category is invalid.');
    }
    query.category = options.category as Expense['category'];
  }

  const date = dateRange(options.from, options.to);
  if (date) query.date = date;

  if (options.search?.trim()) {
    const expression = new RegExp(esc(options.search.trim()), 'i');
    const vehicles = await VehicleModel.find({ $or: [{ registrationNumber: expression }, { name: expression }] }).select('_id');
    query.$or = [
      { expenseNumber: expression },
      { category: expression },
      { description: expression },
      { vehicle: { $in: vehicles.map((item) => item.id) } },
    ];
  }

  return query;
}

function out(record: ExpenseDocument) {
  const selectedVehicle = record.vehicle as unknown as Record<string, unknown>;
  return {
    id: record.id,
    expenseNumber: record.expenseNumber,
    vehicle: selectedVehicle && '_id' in selectedVehicle
      ? { id: String(selectedVehicle._id), registrationNumber: selectedVehicle.registrationNumber, name: selectedVehicle.name }
      : { id: String(record.vehicle) },
    date: record.date,
    category: record.category,
    amount: record.amount,
    description: record.description,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function populated(id: string) {
  if (!isValidObjectId(id)) throw new HttpError(400, 'Expense ID is invalid.');
  const record = await ExpenseModel.findById(id).populate('vehicle');
  if (!record) throw new HttpError(404, 'Expense not found.');
  return record;
}

async function number() {
  const year = new Date().getFullYear();
  const counter = await ExpenseCounterModel.findOneAndUpdate(
    { _id: `expense-${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return `EXP-${year}-${String(counter.sequence).padStart(4, '0')}`;
}

function sort(value?: string) {
  const options: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    date: { date: -1 },
    amount: { amount: -1 },
    category: { category: 1 },
  };
  const selected = value ?? 'newest';
  if (!options[selected]) throw new HttpError(400, 'sort is invalid.');
  return options[selected];
}

function page(options: List) {
  const selectedPage = options.page === undefined ? 1 : Number(options.page);
  const limit = options.limit === undefined ? 20 : Number(options.limit);
  if (!Number.isInteger(selectedPage) || !Number.isInteger(limit) || selectedPage < 1 || limit < 1 || limit > 100) {
    throw new HttpError(400, 'Pagination is invalid.');
  }
  return { page: selectedPage, limit };
}

function dateRange(from?: string, to?: string) {
  if (!from && !to) return undefined;
  const start = from ? new Date(from) : undefined;
  const end = to ? new Date(to) : undefined;
  if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime()))) {
    throw new HttpError(400, 'Date range is invalid.');
  }
  if (end) end.setUTCHours(23, 59, 59, 999);
  if (start && end && start > end) throw new HttpError(400, 'From date cannot be later than to date.');
  return { ...(start ? { $gte: start } : {}), ...(end ? { $lte: end } : {}) };
}

function esc(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
