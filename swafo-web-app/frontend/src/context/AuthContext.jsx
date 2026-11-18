import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { API_BASE_URL, API_ENDPOINTS } from '../api/config';
import { sendPresence } from '../hooks/usePresence';

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
        // If we have a real MSAL account, check if it's permitted on the Student Portal
        if (accounts.length > 0) {
            const msalUser = accounts[0];
            const msalEmail = (msalUser.username || msalUser.idTokenClaims?.preferred_username || '').toLowerCase();
            const msalName = msalUser.name || msalUser.idTokenClaims?.name || '';

            // Strictly forbid Directors and Officers from acquiring a Student session
            const isStaff = 
                msalEmail.includes('director') || 
                msalEmail.includes('ruel.elias') || 
                msalEmail.includes('admin@') || 
                msalEmail.includes('officer') ||
                ['aclag', 'ceballos', 'diamante', 'doroteo', 'nicart', 'omana', 'penano', 'delacruz', 'deguzman', 'santos', 'reyes', 'garcia', 'cruz', 'villanueva', 'ramos', 'luna', 'castro', 'mendoza'].some(s => msalEmail.includes(s));

            if (isStaff) {
                console.warn("Blocked Director/Officer MSAL login to Student Portal:", msalEmail);
                setCurrentUser(null);
                setMockUser(null);
                localStorage.removeItem('swafo_mock_user');
                sessionStorage.setItem('swafo_login_error', 'Access denied. Directors and Officers cannot access the Student Portal. Please use the Officer or Director portal.');
                return;
            }

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
                .then(async res => {
                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || 'Access denied');
                    }
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
                            role: 'STUDENT',
                            token: data.access || null,
                            isMock: false
                        });
                    }
                })
                .catch(err => {
                    console.warn("MSAL profile sync warning:", err);
                    if (err.message && err.message.includes('Access denied')) {
                        setCurrentUser(null);
                        sessionStorage.setItem('swafo_login_error', err.message);
                    }
                });
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
            const payload = { email: email, portal: 'officer' };
            if (password) payload.password = password;

            const res = await fetch(`${API_BASE_URL}/api/users/mock-login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            const user = { 
                id: data.user?.id,
                name: data.user?.full_name || officerName, 
                email: data.user?.email || email,
                role: 'OFFICER',
                must_change_password: Boolean(data.user?.must_change_password),
                token: data.access || null
            };
            localStorage.setItem('swafo_mock_user', JSON.stringify(user));
            setMockUser(user);
            return user;
        } catch (error) {
            console.error("Officer login failed:", error);
            throw error;
        }
    };

    const loginAsAdmin = async (adminName, email, password) => {
        try {
            const payload = { email: email, portal: 'director' };
            if (password) payload.password = password;

            const res = await fetch(`${API_BASE_URL}/api/users/mock-login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            const user = { 
                id: data.user?.id || 1,
                name: data.user?.full_name || adminName || 'Director Ruel Elias', 
                email: data.user?.email || email,
                role: 'ADMIN',
                must_change_password: Boolean(data.user?.must_change_password),
                token: data.access || null
            };
            localStorage.setItem('swafo_mock_user', JSON.stringify(user));
            setMockUser(user);
            return user;
        } catch (error) {
            console.error("Admin login error:", error);
            throw error;
        }
    };

    const updateUser = (updatedFields) => {
        setCurrentUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, ...updatedFields };
            localStorage.setItem('swafo_mock_user', JSON.stringify(updated));
            return updated;
        });
    };

    const logout = () => {
        // 0. Flag officer/director as inactive right away
        if (currentUser?.email) {
            sendPresence(API_ENDPOINTS.PRESENCE_OFFLINE, currentUser.email);
        }

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
        <AuthContext.Provider value={{ user: currentUser, loginAsMock, loginAsOfficer, loginAsAdmin, updateUser, logout }}>
            {children}
        </AuthContext.Provider>
    );

};

export const useAuth = () => useContext(AuthContext);
