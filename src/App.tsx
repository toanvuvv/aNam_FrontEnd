import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import Layout from './components/Layout';
import UserManagement from './pages/UserManagement';
import SwapQueueManagement from './pages/SwapQueueManagement';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={viVN}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<UserManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/swap-queue" element={<SwapQueueManagement />} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;

