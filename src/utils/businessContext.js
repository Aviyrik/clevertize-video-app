// The details that belong to one saved business. Switching business (or resuming a project) loads all of
// them, so nothing — specialty, logo, contact — is carried over from the business that was active before.
function businessContextOf(biz, prev = {}) {
  const logo = biz.logo || biz.brandLogo || null;
  return {
    businessId: biz.id || null,
    businessName: biz.name || biz.businessName || '',
    businessType: biz.category || biz.businessType || 'Retail Store',
    customBusinessType: biz.customBusinessType || '',
    town: biz.town || '',
    area: biz.area || '',
    websiteUrl: biz.websiteUrl || '',
    targetAudience: biz.targetAudience || '',
    brandTone: biz.brandTone || prev.brandTone,
    brandLogo: logo,
    logo,
    specialty: biz.specialty || '',
    occasion: biz.occasion || '',
    contact: biz.contact || '',
    ownerName: biz.ownerName || '',
    productImages: biz.productImages || [],
  };
}

// The saved business a project belongs to: by id, else (older projects and drafts) by name
function findProjectBusiness(project, businesses = []) {
  if (!project) return null;
  if (project.businessId) {
    const byId = businesses.find((b) => b.id === project.businessId);
    if (byId) return byId;
  }
  const name = String(project.businessName || '').trim().toLowerCase();
  if (!name) return null;
  return businesses.find((b) => String(b.name || b.businessName || '').trim().toLowerCase() === name) || null;
}

// Support both CommonJS (Node.js test runner) and ES Modules (Vite)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { businessContextOf, findProjectBusiness };
}
