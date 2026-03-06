/**
 * Convert an audit log type string to a human-readable name.
 * e.g. 'group.member.ban' → 'Member Ban'
 * @param {string} auditLogType
 * @returns {string}
 */
export function getAuditLogTypeName(auditLogType) {
    if (!auditLogType) return '';
    return auditLogType
        .replace('group.', '')
        .replace(/\./g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Resolve an array of role IDs to a comma-separated string of role names.
 * @param {Array<string>} roleIds
 * @param {Array<{id: string, name: string}>} roles - available roles
 * @returns {string}
 */
export function resolveRoleNames(roleIds, roles) {
    const ids = Array.isArray(roleIds) ? roleIds : [];
    const roleList = Array.isArray(roles) ? roles : [];
    const names = [];
    for (const id of ids) {
        const role = roleList.find((r) => r?.id === id);
        if (role?.name) {
            names.push(role.name);
        }
    }
    return names.join(', ');
}
