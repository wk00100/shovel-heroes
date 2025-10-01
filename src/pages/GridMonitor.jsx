import React, { useState, useEffect } from "react";
import { Grid, DisasterArea } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, Users, Package, AlertTriangle, 
  BarChart3, Clock, CheckCircle2
} from "lucide-react";

export default function GridMonitorPage() {
  const [grids, setGrids] = useState([]);
  const [disasterAreas, setDisasterAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGridType, setSelectedGridType] = useState('all');
  const [stats, setStats] = useState({
    totalAreas: 0,
    totalGrids: 0,
    totalVolunteers: 0,
    completedGrids: 0,
    urgentGrids: 0
  });

  useEffect(() => {
    loadData();
    // 每30秒自動更新一次數據
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gridsData, areasData] = await Promise.all([
        Grid.list(),
        DisasterArea.list()
      ]);
      
      setGrids(gridsData);
      setDisasterAreas(areasData);
      
      // 計算統計資料
      const completedGrids = gridsData.filter(g => g.status === 'completed').length;
      const totalVolunteers = gridsData.reduce((sum, g) => sum + (g.volunteer_registered || 0), 0);
      const urgentGrids = gridsData.filter(g => {
        if (g.grid_type !== 'manpower' || !g.volunteer_needed || g.volunteer_needed === 0) return false;
        const shortage = (g.volunteer_needed - (g.volunteer_registered || 0)) / g.volunteer_needed;
        return shortage >= 0.6 && g.status === 'open';
      }).length;
      
      setStats({
        totalAreas: areasData.length,
        totalGrids: gridsData.length,
        totalVolunteers,
        completedGrids,
        urgentGrids
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGridTypeText = (type) => {
    const types = {
      mud_disposal: '污泥暫置場',
      manpower: '人力任務',
      supply_storage: '物資停放處', 
      accommodation: '住宿地點',
      food_area: '領吃食區域'
    };
    return types[type] || '其他';
  };

  const getGridTypeStats = () => {
    const typeStats = {};
    const allGridTypes = ['mud_disposal', 'manpower', 'supply_storage', 'accommodation', 'food_area'];
    allGridTypes.forEach(type => {
      typeStats[type] = grids.filter(g => g.grid_type === type).length;
    });
    return typeStats;
  };

  const filteredGrids = selectedGridType === 'all' 
    ? grids 
    : grids.filter(g => g.grid_type === selectedGridType);

  const getShortageRate = (grid) => {
    if (grid.volunteer_needed === 0) return 0;
    return ((grid.volunteer_needed - (grid.volunteer_registered || 0)) / grid.volunteer_needed) * 100;
  };

  const typeStats = getGridTypeStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* 統計概覽 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 text-center">
            <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{stats.totalAreas}</p>
            <p className="text-xs text-gray-600">災區數量</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{stats.totalGrids}</p>
            <p className="text-xs text-gray-600">網格總數</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{stats.totalVolunteers}</p>
            <p className="text-xs text-gray-600">志工總數</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">-</p>
            <p className="text-xs text-gray-600">物資捐贈</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{stats.completedGrids}</p>
            <p className="text-xs text-gray-600">已完成</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{stats.urgentGrids}</p>
            <p className="text-xs text-gray-600">急需支援</p>
          </CardContent>
        </Card>
      </div>

      {/* 網格類型篩選 */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">網格狀態監控</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedGridType === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedGridType('all')}
            className="text-xs"
          >
            全部 ({grids.length})
          </Button>
          <Button
            size="sm"
            variant={selectedGridType === 'manpower' ? 'default' : 'outline'}
            onClick={() => setSelectedGridType('manpower')}
            className={selectedGridType === 'manpower' ? 'bg-red-600 hover:bg-red-700 text-white text-xs' : 'text-xs'}
          >
            人力任務 ({typeStats.manpower || 0})
          </Button>
          <Button
            size="sm"
            variant={selectedGridType === 'mud_disposal' ? 'default' : 'outline'}
            onClick={() => setSelectedGridType('mud_disposal')}
            className={selectedGridType === 'mud_disposal' ? 'bg-amber-700 hover:bg-amber-800 text-white text-xs' : 'text-xs'}
          >
            污泥暫置場 ({typeStats.mud_disposal || 0})
          </Button>
          <Button
            size="sm"
            variant={selectedGridType === 'supply_storage' ? 'default' : 'outline'}
            onClick={() => setSelectedGridType('supply_storage')}
            className={selectedGridType === 'supply_storage' ? 'bg-green-600 hover:bg-green-700 text-white text-xs' : 'text-xs'}
          >
            物資停放處 ({typeStats.supply_storage || 0})
          </Button>
          <Button
            size="sm"
            variant={selectedGridType === 'accommodation' ? 'default' : 'outline'}
            onClick={() => setSelectedGridType('accommodation')}
            className={selectedGridType === 'accommodation' ? 'bg-purple-600 hover:bg-purple-700 text-white text-xs' : 'text-xs'}
          >
            住宿地點 ({typeStats.accommodation || 0})
          </Button>
          <Button
            size="sm"
            variant={selectedGridType === 'food_area' ? 'default' : 'outline'}
            onClick={() => setSelectedGridType('food_area')}
            className={selectedGridType === 'food_area' ? 'bg-orange-600 hover:bg-orange-700 text-white text-xs' : 'text-xs'}
          >
            領吃食區域 ({typeStats.food_area || 0})
          </Button>
        </div>
      </div>

      {/* 網格清單 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGrids.map((grid) => {
          const shortageRate = grid.grid_type === 'manpower' ? getShortageRate(grid) : 0;
          
          return (
            <Card 
              key={grid.id}
              className={`border-l-4 ${
                grid.status === 'completed' ? 'border-l-green-500' :
                grid.status === 'closed' ? 'border-l-gray-500' :
                grid.grid_type === 'mud_disposal' ? 'border-l-amber-700' :
                grid.grid_type === 'manpower' ? (
                  shortageRate >= 60 ? 'border-l-red-500' :
                  shortageRate >= 40 ? 'border-l-orange-500' :
                  shortageRate > 0 ? 'border-l-amber-500' :
                  'border-l-green-500'
                ) :
                grid.grid_type === 'supply_storage' ? 'border-l-green-600' :
                grid.grid_type === 'accommodation' ? 'border-l-purple-600' :
                grid.grid_type === 'food_area' ? 'border-l-orange-600' :
                'border-l-gray-500'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-base">{grid.code}</h3>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={
                      grid.status === 'completed' ? 'bg-green-100 text-green-800' :
                      grid.status === 'open' ? 'bg-blue-100 text-blue-800' :
                      grid.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {grid.status === 'completed' ? '已完成' :
                       grid.status === 'open' ? '開放中' :
                       grid.status === 'closed' ? '已關閉' : '準備中'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {getGridTypeText(grid.grid_type)}
                    </Badge>
                  </div>
                </div>

                {/* 志工狀態 */}
                {grid.grid_type === 'manpower' && (
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">志工需求</span>
                      </div>
                      <span className={`text-sm font-bold ${
                        shortageRate >= 60 ? 'text-red-600' :
                        shortageRate >= 40 ? 'text-orange-600' :
                        shortageRate > 0 ? 'text-amber-600' :
                        'text-green-600'
                      }`}>
                        {grid.volunteer_registered || 0}/{grid.volunteer_needed || 0}
                      </span>
                    </div>
                    
                    {shortageRate > 0 && (
                      <div className="bg-red-50 p-2 rounded text-xs text-red-700">
                        還缺 {grid.volunteer_needed - (grid.volunteer_registered || 0)} 位志工
                      </div>
                    )}
                  </div>
                )}

                {/* 物資狀態 */}
                {grid.supplies_needed?.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">物資需求</span>
                    </div>
                    <div className="space-y-1">
                      {grid.supplies_needed.slice(0, 2).map((supply, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span>{supply.name}</span>
                          <span className="text-orange-600">
                            {supply.received || 0}/{supply.quantity} {supply.unit}
                          </span>
                        </div>
                      ))}
                      {grid.supplies_needed.length > 2 && (
                        <div className="text-xs text-gray-500">
                          還有 {grid.supplies_needed.length - 2} 項物資需求...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 集合地點 */}
                {grid.meeting_point && (
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>集合: {grid.meeting_point}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 最後更新時間 */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          最後更新: {new Date().toLocaleString('zh-TW')} | 
          資料每30秒自動更新
        </p>
      </div>
    </div>
  );
}