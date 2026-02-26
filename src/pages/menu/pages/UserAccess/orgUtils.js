const normalizeOrgType = (value) => String(value || '').toLowerCase();

export const isTeamOrg = (org) => {
    if (!org) return false;
    return normalizeOrgType(org.org_type) === 'team' || (org.parent !== null && org.parent !== undefined && org.parent !== '');
};

export const isDepartmentOrg = (org) => {
    if (!org) return false;
    return !isTeamOrg(org);
};

export const getDepartmentOptions = (orgs = []) => orgs.filter(isDepartmentOrg);

export const getTeamOptionsForDepartment = (orgs = [], departmentId) => {
    if (!departmentId) return [];
    return orgs.filter((org) => isTeamOrg(org) && String(org.parent) === String(departmentId));
};

export const getOrgNameById = (orgs = [], id) => {
    if (id === null || id === undefined || id === '') return '';
    const found = orgs.find((org) => String(org.id) === String(id));
    return found?.name || '';
};
