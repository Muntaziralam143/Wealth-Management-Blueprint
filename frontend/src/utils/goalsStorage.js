export function getCurrentUserEmail() {
    return localStorage.getItem("currentUserEmail") || "";
}

export function getGoalsKey(email) {
    return `goals:${email}`;
}

export function loadGoals(email) {
    const key = getGoalsKey(email);
    return JSON.parse(localStorage.getItem(key) || "[]");
}

export function saveGoals(email, goals) {
    const key = getGoalsKey(email);
    localStorage.setItem(key, JSON.stringify(goals));
}
