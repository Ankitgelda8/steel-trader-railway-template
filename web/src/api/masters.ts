import client from './client'
import type {
  Company, CompanyCreate,
  Branch, BranchCreate,
  Brand, BrandCreate,
  Customer, CustomerCreate,
} from '../types'

export const mastersApi = {
  // Companies
  listCompanies: async (): Promise<Company[]> => {
    const { data } = await client.get<Company[]>('/masters/companies?limit=500')
    return data
  },
  createCompany: async (payload: CompanyCreate): Promise<Company> => {
    const { data } = await client.post<Company>('/masters/companies', payload)
    return data
  },
  updateCompany: async (id: number, payload: CompanyCreate): Promise<Company> => {
    const { data } = await client.put<Company>(`/masters/companies/${id}`, payload)
    return data
  },

  // Branches
  listBranches: async (company_id?: number): Promise<Branch[]> => {
    const params = company_id ? `?company_id=${company_id}` : ''
    const { data } = await client.get<Branch[]>(`/masters/branches${params}`)
    return data
  },
  createBranch: async (payload: BranchCreate): Promise<Branch> => {
    const { data } = await client.post<Branch>('/masters/branches', payload)
    return data
  },

  // Brands
  listBrands: async (): Promise<Brand[]> => {
    const { data } = await client.get<Brand[]>('/masters/brands')
    return data
  },
  createBrand: async (payload: BrandCreate): Promise<Brand> => {
    const { data } = await client.post<Brand>('/masters/brands', payload)
    return data
  },
  updateBrand: async (id: number, payload: BrandCreate): Promise<Brand> => {
    const { data } = await client.put<Brand>(`/masters/brands/${id}`, payload)
    return data
  },

  // Customers
  listCustomers: async (): Promise<Customer[]> => {
    const { data } = await client.get<Customer[]>('/masters/customers?limit=500')
    return data
  },
  createCustomer: async (payload: CustomerCreate): Promise<Customer> => {
    const { data } = await client.post<Customer>('/masters/customers', payload)
    return data
  },
  updateCustomer: async (id: number, payload: CustomerCreate): Promise<Customer> => {
    const { data } = await client.put<Customer>(`/masters/customers/${id}`, payload)
    return data
  },
}
