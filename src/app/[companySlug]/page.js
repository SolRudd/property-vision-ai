import { notFound } from 'next/navigation'
import ProductFlow from '../../components/app/ProductFlow'
import {
  buildCompanyMetadata,
  getCompanyExperienceConfig,
  listCompanySlugs,
} from '../../lib/companyConfigs'

export function generateStaticParams() {
  return listCompanySlugs().map((companySlug) => ({ companySlug }))
}

export function generateMetadata({ params }) {
  const config = getCompanyExperienceConfig(params.companySlug)

  if (!config) {
    return {}
  }

  return buildCompanyMetadata(config)
}

export default function CompanyLandingPage({ params }) {
  const config = getCompanyExperienceConfig(params.companySlug)

  if (!config) {
    notFound()
  }

  return <ProductFlow experienceConfig={config} />
}
