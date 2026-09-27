import React, { useState } from 'react';
import { UserAccount } from '../../types';
import { StaffSisPortal } from './StaffSisPortal';
import { SupabaseStatusModal } from '../supabase/SupabaseStatusModal';

interface Props {
  currentUser: UserAccount;
  onLogout: () => void;
  onSwitchToStudentView: (student: UserAccount) => void;
  onSwitchToPortal: () => void;
}

export const TeacherDashboard: React.FC<Props> = ({
  currentUser,
  onLogout,
  onSwitchToStudentView,
  onSwitchToPortal,
}) => {
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  return (
    <>
      <StaffSisPortal
        currentUser={currentUser}
        onLogout={onLogout}
        onSwitchToStudentView={onSwitchToStudentView}
        onSwitchToPortal={onSwitchToPortal}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />
      <SupabaseStatusModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </>
  );
};
