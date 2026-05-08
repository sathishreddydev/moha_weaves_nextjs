import { MetadataRoute } from 'next'
import { productService } from './api/products/productService'
import { createSlug } from '@/lib/utils/slug'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Get all products for sitemap
    const products = await productService.getProductsByRole({}, 'user')
    
    // Get categories for sitemap
    const filtersResponse = await fetch(`/api/filters`)
    if (!filtersResponse.ok) {
      throw new Error('Failed to fetch filters')
    }
    const filtersData = await filtersResponse.json()
    const categories = filtersData.categories || []

  // Static pages
  const staticPages = [
    {
      url: '/',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: '/collections',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: '/categories',
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]

  // Category pages
  const categoryPages = categories.map((category: any) => ({
    url: `/collections?category=${createSlug(category.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // Subcategory pages
  const subcategoryPages: any[] = []
  categories.forEach((category: any) => {
    if (category.subcategories) {
      category.subcategories.forEach((subcategory: any) => {
        subcategoryPages.push({
          url: `/collections?subcategory=${createSlug(subcategory.name)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.85,
        })
      })
    }
  })

  // Product pages
  const productPages = products.map((product: any) => {
    const categorySlug = createSlug(product.category?.name || 'ethnic-wear')
    const productSlug = product.urlSlug || createSlug(product.name)
    return {
      url: `/collections/${categorySlug}/${productSlug}`,
      lastModified: new Date(product.updatedAt || product.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }
  })

  return [...staticPages, ...categoryPages, ...subcategoryPages, ...productPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    // Return static pages only if dynamic data fails
    const staticPages = [
      {
        url: '/',
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: '/collections',
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
      {
        url: '/categories',
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
    ]
    
    return staticPages
  }
}
