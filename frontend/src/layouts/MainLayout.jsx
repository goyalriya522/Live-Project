import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import NotificationModal from '../components/NotificationModal';
import { useSocket } from '../context/SocketContext';

export const MainLayout = ({ children }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { latestNotification } = useSocket();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        onOpenNotifications={() => setIsNotifOpen(true)}
        unreadCount={latestNotification ? 1 : 0}
      />
      <main className="flex-1">{children}</main>
      <Footer />

      <NotificationModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={
          latestNotification
            ? [
                latestNotification,
                {
                  _id: 'campusbus_notif_01',
                  title: 'CampusBus Smart Transit Operational',
                  message: 'Official transit portal for CampusBus. Smart college bus tracking active across routes.',
                  type: 'info',
                  createdAt: new Date(),
                },
              ]
            : [
                {
                  _id: 'campusbus_notif_01',
                  title: 'CampusBus Smart Transit Operational',
                  message: 'Official transit portal for CampusBus. Smart college bus tracking active across routes.',
                  type: 'info',
                  createdAt: new Date(),
                },
              ]
        }
      />
    </div>
  );
};

export default MainLayout;

