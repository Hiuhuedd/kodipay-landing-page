'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch additional user profile from Firestore
  const fetchUserProfile = async (uid, baseData) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        const profile = docSnap.data();
        let agencyStatus = 'active';
        let subscription = { activePlan: 'starter_trial', status: 'trial', propertiesLimit: 2 };
        
        if (profile.agencyId) {
          const settingsSnap = await getDoc(doc(db, 'settings', profile.agencyId));
          if (settingsSnap.exists()) {
            const settings = settingsSnap.data();
            if (settings.accountStatus === 'Suspended') {
              agencyStatus = 'suspended';
            }
          }

          const agencySnap = await getDoc(doc(db, 'agencies', profile.agencyId));
          if (agencySnap.exists()) {
            subscription = agencySnap.data().subscription || subscription;
          }
        }

        return {
          ...baseData,
          role: profile.role || 'subagent',
          agencyId: profile.agencyId,
          assignedProperties: profile.assignedProperties || [],
          name: profile.name || baseData.displayName,
          status: profile.status || 'active',
          agencyStatus,
          subscription
        };
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    return baseData;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const baseUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          authType: 'firebase'
        };
        const fullUser = await fetchUserProfile(firebaseUser.uid, baseUser);
        setUser(fullUser);
      } else {
        const customToken = localStorage.getItem('kp_token');
        const savedUser = localStorage.getItem('kp_user');
        
        if (customToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                const fullUser = await fetchUserProfile(parsedUser.uid, {
                    ...parsedUser,
                    authType: 'custom'
                });
                setUser(fullUser);
            } catch (e) {
                localStorage.removeItem('kp_token');
                localStorage.removeItem('kp_user');
            }
        } else {
            setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      const baseUser = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        authType: 'firebase'
      };
      const fullUser = await fetchUserProfile(auth.currentUser.uid, baseUser);
      setUser(fullUser);
    } else {
      const savedUser = localStorage.getItem('kp_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        const fullUser = await fetchUserProfile(parsedUser.uid, {
          ...parsedUser,
          authType: 'custom'
        });
        setUser(fullUser);
      }
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('kp_token', token);
    localStorage.setItem('kp_user', JSON.stringify(userData));
    setUser({ ...userData, authType: 'custom' });
  };

  const logout = async () => {
    await auth.signOut();
    localStorage.removeItem('kp_token');
    localStorage.removeItem('kp_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isAdmin: user?.role === 'admin' }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
