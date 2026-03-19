import { notFound } from 'next/navigation'
import App from '../page'
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

  return <App experienceConfig={config} />
}
