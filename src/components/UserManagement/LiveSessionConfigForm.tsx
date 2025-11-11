import React from 'react';
import { Form, InputNumber, Checkbox } from 'antd';
import type { FormInstance } from 'antd';
import type { LiveSessionConfig } from '../../types';

interface Props {
  form: FormInstance<any>;
  initialValues: Partial<LiveSessionConfig>;
  onSaveConfigChange: (e: any) => void;
  saveConfig: boolean;
}

const LiveSessionConfigForm: React.FC<Props> = ({ form, initialValues, onSaveConfigChange, saveConfig }) => {
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      name="prepare_products_config"
    >
      <Form.Item
        name="numberOfSessions"
        label="Số session gần nhất để lấy sản phẩm"
        rules={[{ required: true, message: 'Vui lòng nhập số session!' }]}
        tooltip="Lấy sản phẩm từ N phiên live gần đây nhất (tối đa 10)."
      >
        <InputNumber min={1} max={10} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="minAtc"
        label="Số lượt thêm vào giỏ (ATC) tối thiểu"
        rules={[{ required: true, message: 'Vui lòng nhập ATC tối thiểu!' }]}
        tooltip="Sản phẩm sẽ được chọn nếu có ATC >= giá trị này. Nhập 0 để không lọc theo ATC."
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="minRevenue"
        label="Doanh thu tối thiểu"
        rules={[{ required: true, message: 'Vui lòng nhập doanh thu tối thiểu!' }]}
        tooltip="Sản phẩm sẽ được chọn nếu có Doanh thu >= giá trị này. Nhập 0 để không lọc theo doanh thu."
      >
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => {
            if (!value) return '';
            return value.replace(/,/g, '') as any;
          }}
        />
      </Form.Item>

      <Form.Item
        name="productClicks"
        label="Số lượt click sản phẩm tối thiểu"
        rules={[{ required: true, message: 'Vui lòng nhập số lượt click tối thiểu!' }]}
        tooltip="Sản phẩm sẽ được chọn nếu có số lượt click >= giá trị này. Nhập 0 để không lọc theo số lượt click."
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item>
        <Checkbox checked={saveConfig} onChange={onSaveConfigChange}>
          Lưu lại cấu hình này cho lần sau
        </Checkbox>
      </Form.Item>
    </Form>
  );
};

export default LiveSessionConfigForm;

