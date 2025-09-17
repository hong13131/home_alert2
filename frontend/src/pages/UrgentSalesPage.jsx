import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const name = payload[0].name;
    
    let formattedValue = '';
    if (name === '평균 매매가') {
      formattedValue = `${(value / 10000).toFixed(2)}억원`;
    } else {
      formattedValue = `${value}건`;
    }

    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
        <p className="font-bold">{label}</p>
        <p className="text-sm">{`${name}: ${formattedValue}`}</p>
      </div>
    );
  }
  return null;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const UrgentSalesPage = () => {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedArea, setSelectedArea] = useState('전체 보기');
  const [isItemSelected, setIsItemSelected] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  
  const debouncedKeyword = useDebounce(keyword, 300);

  useEffect(() => {
    const handleSearch = async () => {
      if (!debouncedKeyword || isItemSelected) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/apartments/search?keyword=${debouncedKeyword}`);
        const data = await response.json();
        if (response.ok) {
          setSearchResults(data);
        } else {
          setError(data.error || '검색에 실패했습니다.');
        }
      } catch (err) {
        setError('서버와 통신 중 오류가 발생했습니다.');
      }
      setLoading(false);
    };
    handleSearch();
  }, [debouncedKeyword, isItemSelected]);

  const handleSelectComplex = async (complex) => {
    setIsItemSelected(true);
    setKeyword(complex.name);
    setSearchResults([]);
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const response = await fetch(`/api/apartments/${complex.id}/analysis?trade_type=A1`);
      const data = await response.json();
      if (response.ok) {
        setAnalysis(data);
        setSelectedArea('전체 보기');
      } else {
        setError(data.error || '분석 데이터 로딩에 실패했습니다.');
      }
    } catch (err) {
      setError('서버와 통신 중 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  const availableAreas = useMemo(() => {
    if (!analysis || !analysis.all_sales) return [];
    const areas = [...new Set(analysis.all_sales.map(item => item.areaGroup))];
    return areas.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.match(/\d+/)?.[0] || 0);
      return numA - numB;
    });
  }, [analysis]);

  const filteredSales = useMemo(() => {
    if (!analysis || !analysis.all_sales) return [];
    if (selectedArea === '전체 보기') return analysis.all_sales;
    return analysis.all_sales.filter(item => item.areaGroup === selectedArea);
  }, [analysis, selectedArea]);

  const renderSalesTable = (sales, title, isScrollable = false, isBargainTable = false) => {
    const headers = ['동', '층', '가격', '평형', '방향', '확인일'];
    if (isBargainTable) {
      headers.splice(3, 0, '할인율'); // Insert '할인율' after '가격'
    }

    return (
      <div className="space-y-2">
        <h3 className="text-xl font-bold">{title} ({sales.length}건)</h3>
        <div className={`overflow-x-auto ${isScrollable ? 'max-h-96 overflow-y-auto' : ''}`}>
          <table className="min-w-full bg-white border rounded-lg text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {headers.map(h => <th key={h} className="py-2 px-2 border-b">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {sales.map((item, index) => (
                <tr key={index} className="text-center hover:bg-gray-50 cursor-pointer" onClick={() => setModalItem(item)}>
                  <td className="py-2 px-2 border-b">{item.buildingName}</td>
                  <td className="py-2 px-2 border-b">{item.floorInfo}</td>
                  <td className="py-2 px-2 border-b">{item.dealOrWarrantPrc}</td>
                  {isBargainTable && (
                    <td className="py-2 px-2 border-b text-red-500 font-bold">
                      {item.discount_pct ? `${item.discount_pct.toFixed(1)}%` : '-'}
                    </td>
                  )}
                  <td className="py-2 px-2 border-b">{item.areaName}</td>
                  <td className="py-2 px-2 border-b">{item.direction}</td>
                  <td className="py-2 px-2 border-b">{item.articleConfirmYmd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {modalItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold">{modalItem.articleName} {modalItem.areaName}</h3>
              <p className="text-sm text-gray-600">{modalItem.buildingName} {modalItem.floorInfo}층</p>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="font-semibold text-gray-600">가격</span><span className="font-bold text-blue-600">{modalItem.dealOrWarrantPrc}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-gray-600">방향</span><span>{modalItem.direction}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-gray-600">확인일</span><span>{modalItem.articleConfirmYmd}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-gray-600">부동산</span><span>{modalItem.realtorName}</span></div>
              <div><h4 className="font-semibold text-gray-600 mb-1">특징</h4><p className="text-gray-800 bg-gray-50 p-2 rounded">{modalItem.articleFeatureDesc}</p></div>
              <div><h4 className="font-semibold text-gray-600 mb-1">태그</h4><div className="flex flex-wrap gap-2">{modalItem.tagList.map(tag => <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{tag}</span>)}</div></div>
            </div>
            <div className="p-4 border-t sticky bottom-0 bg-white"><button onClick={() => setModalItem(null)} className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">닫기</button></div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold">부동산 매물 분석</h2>
      
      <div className="relative">
        <div className="flex items-center">
          <input type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); setIsItemSelected(false); }} placeholder="아파트 이름 또는 지역 입력..." className="w-full px-4 py-2 border rounded-lg" />
          <Search className="w-5 h-5 absolute right-3 text-gray-400" />
        </div>
        {searchResults.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto">
            {searchResults.map(item => (<li key={item.id} onClick={() => handleSelectComplex(item)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{item.name}</li>))}
          </ul>
        )}
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {loading && <p>데이터를 불러오는 중입니다...</p>}
      
      {analysis && (
        <div className="space-y-8">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setSelectedArea('전체 보기')} className={`px-3 py-1 text-sm rounded-full ${selectedArea === '전체 보기' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>전체 보기</button>
              {availableAreas.map(area => <button key={area} onClick={() => setSelectedArea(area)} className={`px-3 py-1 text-sm rounded-full ${selectedArea === area ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>{area}</button>)}
            </div>
            {renderSalesTable(filteredSales, '전체 매물 리스트', true)}
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold">📈 평형별 평균 가격</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysis.mean_prices} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="areaName" fontSize={12} interval={0} angle={-45} textAnchor="end" height={50} />
                  <YAxis tickFormatter={(val) => `${(val / 10000).toFixed(1)}억`} fontSize={12} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(206, 206, 206, 0.2)'}} />
                  <Bar dataKey="price_num" name="평균 매매가">
                    {analysis.mean_prices.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    <LabelList dataKey="price_num" position="top" formatter={(val) => `${(val / 10000).toFixed(1)}억`} fontSize={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-xl font-bold">📊 평형별 매물 수</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysis.count_by_area} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="areaName" fontSize={12} interval={0} angle={-45} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(206, 206, 206, 0.2)'}} />
                  <Bar dataKey="count" name="매물 수">
                    {analysis.count_by_area.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    <LabelList dataKey="count" position="top" fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {renderSalesTable(analysis.bargains, '🔥 급매 추정 매물', false, true)}
        </div>
      )}
    </div>
  );
};

export default UrgentSalesPage;
