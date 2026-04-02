import ProductFlow from '../../components/app/ProductFlow'
import { buildPageMetadata } from '../../lib/siteConfig'

export const metadata = buildPageMetadata({
  title: 'Generate a Landscaping Preview',
  description:
    'Upload a property photo, choose a landscaping style, and generate a faithful before-and-after concept.',
  path: '/generate',
})

function readSearchParam(value) {
  return Array.isArray(value) ? value[0] || '' : String(value || '')
}

export default function GeneratePage({ searchParams }) {
  return (
    <ProductFlow
      initialStep="upload"
      allowHero={false}
      basePath="/generate"
      initialSelectedStyle={readSearchParam(searchParams?.style)}
    />
  )
}
