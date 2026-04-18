import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const { accounts } = useMsal();
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
        if (mockUser) {
            setCurrentUser({
                name: mockUser.name,
                email: mockUser.email,
                role: 'STUDENT',
                isMock: true
            });
        } else if (accounts.length > 0) {
            setCurrentUser({
                name: accounts[0].name,
                email: accounts[0].username,
                role: 'STUDENT',
                isMock: false
            });
        } else {
            setCurrentUser(null);
        }
    }, [accounts, mockUser]);

    const loginAsMock = (student) => {
        const user = { name: student.user_details.full_name, email: student.user_details.email };
        localStorage.setItem('swafo_mock_user', JSON.stringify(user));
        setMockUser(user);
    };

    const logout = () => {
        localStorage.removeItem('swafo_mock_user');
        setMockUser(null);
        // MSAL logout handles the rest
    };

    return (
        <AuthContext.Provider value={{ user: currentUser, loginAsMock, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
