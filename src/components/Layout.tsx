import React from 'react';
import { Layout as AntLayout, Menu, Typography } from 'antd';
import { UserOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Sider } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Quản lý User',
    },
    {
      key: '/swap-queue',
      icon: <SwapOutlined />,
      label: 'Swap Queue',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <AntLayout style={{ minHeight: '100vh', height: '100vh' }}>
      <Sider width={250} theme="dark" style={{ overflow: 'auto' }}>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            Shopee Manager
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout style={{ display: 'flex', flexDirection: 'column' }}>
        <Header style={{ background: '#fff', padding: '0 24px', flexShrink: 0 }}>
          <Title level={3} style={{ margin: 0, lineHeight: '64px', whiteSpace: 'nowrap' }}>
            Hệ thống quản lý Shopee
          </Title>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: '24px', overflow: 'auto', flex: 1 }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;

