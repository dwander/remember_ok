/**
 * 앱 전역 설정값
 * @namespace APP_CONFIG
 * @description 앱에서 사용하는 기본 설정값들을 정의
 */

const APP_CONFIG = {
    /** @type {number} 드래그 앤 드롭 애니메이션 지속 시간 (밀리초) */
    ANIMATION_DURATION: 200,
    
    /** @type {Array<Object>} 기본 할 일 목록 */
    DEFAULT_TASKS: [
        { id: 1, text: '신랑신부 포즈컷', completed: false },
        { id: 2, text: '신부 포즈컷', completed: false },
        { id: 3, text: '신랑신부 정면', completed: false },
        { id: 4, text: '양가 촬주', completed: false },
        { id: 5, text: '신랑측 직계가족', completed: true },
        { id: 6, text: '신부측 직계가족', completed: true },
        { id: 7, text: '직장동료 우인', completed: false },
        { id: 8, text: '부케 던지기', completed: false }
    ]
};