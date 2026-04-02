export default function BrandMark({
  logo,
  companyName,
  imageClassName = 'gv-logo-img',
}) {
  if (logo?.imageSrc) {
    return (
      <img
        src={logo.imageSrc}
        alt={logo.alt || companyName}
        className={imageClassName}
      />
    )
  }

  return (
    <>
      <span className="lp-logo-mark">{logo?.primaryText || companyName}</span>
      {logo?.accentText && <span className="lp-logo-accent">{logo.accentText}</span>}
    </>
  )
}
