import React from 'react';
import { MapPin, Star } from 'lucide-react';

const ApartmentCard = ({ apartment }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
    <div className="flex justify-between items-start mb-2">
      <div>
        <h4 className="font-semibold text-gray-900">{apartment.HOUSE_NM}</h4>
        <p className="text-sm text-gray-500 flex items-center mt-1">
          <MapPin className="w-3 h-3 mr-1" />
          {apartment.SUBSCRPT_AREA_CODE_NM}
        </p>
      </div>
      <button className="text-gray-400 hover:text-yellow-500">
        <Star className="w-5 h-5" />
      </button>
    </div>
    
    <div className="grid grid-cols-3 gap-2 mt-3 text-sm text-center">
      <div>
        <p className="text-gray-500">분양가</p>
        <p className="font-semibold">확인필요</p>
      </div>
      <div>
        <p className="text-gray-500">예상수익</p>
        <p className="font-semibold text-green-600">미정</p>
      </div>
      <div>
        <p className="text-gray-500">경쟁률</p>
        <p className="font-semibold">미정</p>
      </div>
    </div>
    
    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
      <span className="text-sm text-gray-500">마감: {apartment.RCEPT_ENDDE}</span>
      <a href={apartment.PBLANC_URL} target="_blank" rel="noopener noreferrer" className="bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600">
        상세보기
      </a>
    </div>
  </div>
);

export default ApartmentCard;
