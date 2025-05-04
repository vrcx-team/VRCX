function hasGroupPermission(ref, permission) {
    if (
        ref &&
        ref.myMember &&
        ref.myMember.permissions &&
        (ref.myMember.permissions.includes('*') ||
            ref.myMember.permissions.includes(permission))
    ) {
        return true;
    }
    return false;
}

export { hasGroupPermission };
