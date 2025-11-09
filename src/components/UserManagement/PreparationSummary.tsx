import React from 'react';
import { Card, Descriptions, Statistic, Row, Col, Typography, Tag, Alert } from 'antd';
import { ShoppingCartOutlined, PlaySquareOutlined, DatabaseOutlined, CheckCircleOutlined, ExperimentOutlined, DeleteOutlined } from '@ant-design/icons';
import type { PreparationSummary as SummaryData } from '../../types';

const { Title } = Typography;

interface Props {
  summary: SummaryData;
}

const PreparationSummary: React.FC<Props> = ({ summary }) => {
  if (!summary) {
    return <div>Không có dữ liệu tóm tắt</div>;
  }

  return (
    <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '16px' }}>
      <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
        📊 Kết quả chuẩn bị sản phẩm
      </Title>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card size="small" style={{ background: '#fafafa' }}>
            <Descriptions title={<><ShoppingCartOutlined /> Thông tin giỏ hàng</>} size="small" column={2}>
              <Descriptions.Item label="Sức chứa (Capacity)"><Tag color="blue">{summary.cartCapacity || 0}</Tag></Descriptions.Item>
              <Descriptions.Item label="Sản phẩm mẫu"><Tag color="purple">{summary.sampleProductCount || 0}</Tag></Descriptions.Item>
              <Descriptions.Item label="Cần lấp đầy"><Tag color="green"><strong>{summary.remainingSlots || 0}</strong></Tag></Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {summary.liveSession && (
          <Col span={24}>
            <Card size="small" style={{ background: '#fafafa' }}>
              <Descriptions title={<><PlaySquareOutlined /> Lấy từ Live Session</>} size="small" column={1}>
                <Descriptions.Item label="Session IDs">{summary.liveSession.sessionIds?.join(', ') || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Tên Session"><em>{summary.liveSession.sessionTitles || 'N/A'}</em></Descriptions.Item>
                <Descriptions.Item label="Sản phẩm qua bộ lọc">{summary.liveSession.totalItemsFromLive || 0}</Descriptions.Item>
                <Descriptions.Item label="Map được vào kho"><strong>{summary.liveSession.itemsMappedToWarehouse || 0}</strong></Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        )}

        {summary.sample && (
          <Col span={24}>
            <Card size="small" style={{ background: '#fafafa' }}>
              <Descriptions title={<><ExperimentOutlined /> Lấy từ Sản phẩm Mẫu</>} size="small" column={2}>
                <Descriptions.Item label="Tổng sản phẩm mẫu">{summary.sample.totalSamples || 0}</Descriptions.Item>
                <Descriptions.Item label="Đã thêm vào giỏ"><strong>{summary.sample.itemsAdded || 0}</strong></Descriptions.Item>
                {summary.sample.itemsSkippedInvalid > 0 && (
                  <Descriptions.Item label="Bỏ qua (không hợp lệ)"><Tag color="orange">{summary.sample.itemsSkippedInvalid}</Tag></Descriptions.Item>
                )}
                {summary.sample.itemsSkippedDuplicate > 0 && (
                  <Descriptions.Item label="Bỏ qua (trùng với Live)"><Tag color="blue">{summary.sample.itemsSkippedDuplicate}</Tag></Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>
        )}

        {summary.warehouse && (
          <Col span={24}>
            <Card size="small" style={{ background: '#fafafa' }}>
              <Descriptions title={<><DatabaseOutlined /> Bổ sung từ Kho Link</>} size="small" column={2}>
                <Descriptions.Item label="Có sẵn trong kho">{summary.warehouse.totalAvailable || 0}</Descriptions.Item>
                <Descriptions.Item label="Lấy ngẫu nhiên"><strong>{summary.warehouse.randomSelected || 0}</strong></Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        )}

        {summary.final && (
          <Col span={24}>
            <Card size="small" type="inner" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
               <Descriptions title={<><CheckCircleOutlined /> Kết quả cuối cùng</>} size="small" column={1}>
                  <Descriptions.Item label="Tổng sản phẩm được gán">
                      <Statistic value={summary.final.totalItems || 0} suffix="sản phẩm" valueStyle={{ color: '#3f8600', fontSize: 18 }} />
                  </Descriptions.Item>
                  <Descriptions.Item label="- Từ Live Session">{summary.final.itemsFromLive || 0}</Descriptions.Item>
                  {summary.final.itemsFromSample !== undefined && (
                    <Descriptions.Item label="- Từ Sản phẩm Mẫu">{summary.final.itemsFromSample}</Descriptions.Item>
                  )}
                  <Descriptions.Item label="- Từ Kho Link">{summary.final.itemsFromWarehouse || 0}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        )}

        {summary.deletedUnusedLinks !== undefined && summary.deletedUnusedLinks > 0 && (
          <Col span={24}>
            <Alert
              message={
                <span>
                  <DeleteOutlined /> Đã xóa <strong>{summary.deletedUnusedLinks}</strong> link không được sử dụng từ lần chuẩn bị trước
                </span>
              }
              description="Các link trong cartAssignment cũ mà không được sử dụng lại trong lần chuẩn bị này đã được xóa khỏi kho."
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Col>
        )}
      </Row>
    </div>
  );
};

export default PreparationSummary;

