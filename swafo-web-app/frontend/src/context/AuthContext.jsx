import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";

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
            setCurrentUser({
                name: msalUser.name,
                email: msalUser.username,
                role: 'STUDENT', // Default to STUDENT for MSAL, will be refined by backend fetches
                isMock: false
            });
            // Clear mock storage to prevent confusion
            if (localStorage.getItem('swafo_mock_user')) {
                localStorage.removeItem('swafo_mock_user');
                setMockUser(null);
            }
        } else if (mockUser) {
            setCurrentUser({
                name: mockUser.name,
                email: mockUser.email,
                role: mockUser.role || 'STUDENT',
                isMock: true
            });
        } else {
            setCurrentUser(null);
        }
    }, [accounts, mockUser]);

    const loginAsMock = (student) => {
        const user = { 
            name: student.user_details.full_name, 
            email: student.user_details.email,
            role: 'STUDENT'
        };
        localStorage.setItem('swafo_mock_user', JSON.stringify(user));
        setMockUser(user);
    };

    const loginAsOfficer = (officerName, email) => {
        const user = { 
            name: officerName, 
            email: email,
            role: 'OFFICER'
        };
        localStorage.setItem('swafo_mock_user', JSON.stringify(user));
        setMockUser(user);
    };

    const loginAsAdmin = (adminName, email) => {
        const user = { 
            name: adminName, 
            email: email,
            role: 'ADMIN'
        };
        localStorage.setItem('swafo_mock_user', JSON.stringify(user));
        setMockUser(user);
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
