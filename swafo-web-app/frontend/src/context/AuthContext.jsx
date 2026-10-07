import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { API_BASE_URL } from '../api/config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const { instance, accounts } = useMsal();
    const [mockUser, setMockUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    // Initial load from storage
    useEffect(() => {
        const savedMock = localStorage.getItem('swafo_mock_user');
        if (savedMock) {
            setMockUser(JSON.parse(savedMock));
        }
    }, []);

    // Identity Resolver Logic
    useEffect(() => {
        // If we have a real MSAL account, it takes absolute precedence over any mock data
        if (accounts.length > 0) {
            const msalUser = accounts[0];
            const msalEmail = msalUser.username || msalUser.idTokenClaims?.preferred_username || '';
            const msalName = msalUser.name || msalUser.idTokenClaims?.name || '';

            setCurrentUser(prev => ({
                id: prev?.id,
                name: msalName || prev?.name,
                email: msalEmail || prev?.email,
                role: 'STUDENT',
                isMock: false,
                token: prev?.token || null
            }));

            // Sync with backend to ensure student account and StudentProfile are created/persisted in database
            if (msalEmail) {
                fetch(`${API_BASE_URL}/api/users/profile-by-email/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: msalEmail,
                        name: msalName
                    })
                })
                .then(res => {
                    if (!res.ok) return null;
                    return res.json();
                })
                .then(data => {
                    if (data && data.profile) {
                        setCurrentUser({
                            id: data.user?.id || data.profile.user_details?.id,
                            student_profile_id: data.profile.id,
                            name: data.profile.user_details?.full_name || msalName,
                            email: msalEmail,
                            student_number: data.profile.student_number,
                            course: data.profile.course,
                            role: data.user?.role || 'STUDENT',
                            token: data.access || null,
                            isMock: false
                        });
                    }
                })
                .catch(err => console.warn("MSAL profile sync warning:", err));
            }

            // Clear mock storage to prevent confusion
            if (localStorage.getItem('swafo_mock_user')) {
                localStorage.removeItem('swafo_mock_user');
                setMockUser(null);
            }
        } else if (mockUser) {
            setCurrentUser({
                id: mockUser.id,
                name: mockUser.name,
                email: mockUser.email,
                role: mockUser.role || 'STUDENT',
                isMock: true,
                token: mockUser.token
            });
        } else {
            setCurrentUser(null);
        }
    }, [accounts, mockUser]);

    const loginAsMock = async (student) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/mock-login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: student.user_details.email })
            });
            const data = await res.json();
            
            const user = { 
                id: data.user?.id || student.id,
                name: student.user_details.full_name, 
                email: student.user_details.email,
                role: 'STUDENT',
                token: data.access || null
            };
            localStorage.setItem('swafo_mock_user', JSON.stringify(user));
            setMockUser(user);
            return user;
        } catch (error) {
            console.warn("Mock student login network issue, using local session:", error);
            const user = { 
                id: student.id,
                name: student.user_details.full_name, 
                email: student.user_details.email,
                role: 'STUDENT',
                token: 'mock-student-token'
            };
            localStorage.setItem('swafo_mock_user', JSON.stringify(user));
            setMockUser(user);
            return user;
        }
    };

    const loginAsOfficer = async (officerName, email, password) => {
        try {
            const payload = { email: email };
            if (password) payload.password = password;

            const res = await fetch(`${API_BASE_URL}/api/users/mock-login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                // If backend returns 404 (e.g. account not seeded on remote DB yet), fall back to client session
                if (res.status === 404 && (officerName || email)) {
                    console.warn("Officer not found in remote DB, falling back to active officer session:", email);
                    const fallbackUser = {
                        id: 999,
                        name: officerName || email.split('@')[0].replace('.', ' ').title(),
                        email: email,
                        role: 'OFFICER',
                        token: 'fallback-officer-token'
                    };
                    localStorage.setItem('swafo_mock_user', JSON.stringify(fallbackUser));
                    setMockUser(fallbackUser);
                    return fallbackUser;
                }
                throw new Error(data.error || 'Authentication failed');
            }

            const user = { 
                id: data.user?.id,
                name: data.user?.full_name || officerName, 
                email: data.user?.email || email,
                role: 'OFFICER',
                token: data.access || null
            };
            localStorage.setItem('swafo_mock_user', JSON.stringify(user));
            setMockUser(user);
            return user;
        } catch (error) {
            if (officerName || (email && email.includes('@dlsud.edu.ph'))) {
                console.warn("Using resilient fallback for officer login:", email);
                const fallbackUser = {
                    id: 999,
                    name: officerName || email.split('@')[0],
                    email: email,
                    role: 'OFFICER',
                    token: 'fallback-officer-token'
                };
                localStorage.setItem('swafo_mock_user', JSON.stringify(fallbackUser));
                setMockUser(fallbackUser);
                return fallbackUser;
            }
            console.error("Officer login failed", error);
            throw error;
        }
    };

    const loginAsAdmin = async (adminName, email) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/mock-login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });
            const data = await res.json();

            const user = { 
                id: data.user?.id || 1,
                name: data.user?.full_name || adminName, 
                email: data.user?.email || email,
                role: 'ADMIN',
                token: data.access || 'admin-demo-token'
            };
            localStorage.setItem('swafo_mock_user', JSON.stringify(user));
            setMockUser(user);
            return user;
        } catch (error) {
            console.warn("Admin mock login network issue, using demo fallback:", error);
            const user = { 
                id: 1,
                name: adminName, 
                email: email,
                role: 'ADMIN',
                token: 'admin-demo-token'
            };
            localStorage.setItem('swafo_mock_user', JSON.stringify(user));
            setMockUser(user);
            return user;
        }
    };

    const logout = () => {
        // 1. Clear local mock data
        localStorage.removeItem('swafo_mock_user');
        setMockUser(null);
        setCurrentUser(null);
        
        // 2. Simple MSAL Logout if active
        if (instance && accounts.length > 0) {
            instance.logoutRedirect({
                postLogoutRedirectUri: "/",
            }).catch(e => {
                console.error("MSAL Logout error:", e);
                window.location.href = "/";
            });
        } else {
            // 3. Just go home for mock users
            window.location.href = "/";
        }
    };

    return (
        <AuthContext.Provider value={{ user: currentUser, loginAsMock, loginAsOfficer, loginAsAdmin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
