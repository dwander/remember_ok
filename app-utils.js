/**
 * 유틸리티 함수들을 모아놓은 네임스페이스
 * @namespace Utils
 * @description 앱에서 공통으로 사용하는 유틸리티 함수들
 */
const Utils = {
    /**
     * 타임스탬프 기반 고유 ID 생성
     * @function generateId
     * @returns {number} 고유한 타임스탬프 ID
     * @description 새로운 할 일 항목에 사용할 고유 식별자를 생성합니다
     */
    generateId() {
        return Date.now();
    }
};
