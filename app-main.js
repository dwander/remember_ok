/**
 * 서비스워커 초기화(옵션): URL에 `_swreset=1`이 있을 때만 실행
 * - 현재 경로(scope) 내의 등록된 SW만 해제
 * - CacheStorage 정리(옵션 시에만)
 */
(function(){
    try {
        const url = new URL(window.location.href);
        const doReset = url.searchParams.get('_swreset') === '1';
        if (!doReset) return;
        const base = new URL('.', window.location.href).href;
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations()
                .then((regs) => {
                    const targets = regs.filter(r => (r.scope || '').startsWith(base));
                    return Promise.all(targets.map(r => r.unregister()));
                })
                .then(async () => {
                    if (window.caches && typeof caches.keys === 'function') {
                        const keys = await caches.keys();
                        await Promise.all(keys.map(k => caches.delete(k)));
                    }
                    url.searchParams.delete('_swreset');
                    url.searchParams.set('_r', String(Date.now()));
                    window.location.replace(url.toString());
                })
                .catch(() => {});
        }
    } catch (e) {}
})();

/**
 * Vue.js 앱을 초기화하고 실행하는 메인 함수
 * @function initializeVueApp
 * @description Vue 라이브러리 로딩을 대기하고 앱을 초기화합니다
 */

    const { createApp, onMounted } = Vue;
    const taskManager = new TaskManager();

    /**
     * Vue 앱 인스턴스 생성 및 설정
     * @description 컴포지션 API를 사용하여 반응형 상태와 메서드를 정의합니다
     */
    const app = createApp({
        setup() {
            /**
             * 강력 새로고침: 스토리지 초기화 + SW 초기화 플래그 + 캐시무효 URL 재진입
             * @returns {void}
             */
            const strongRefresh = () => {
                /* 스토리지는 보존합니다(로컬/세션 초기화 제거) */const url = new URL(window.location.href);
                url.searchParams.set('_swreset', '1');
                url.searchParams.set('_r', String(Date.now()));
                window.location.replace(url.toString());
            };

            /**
             * 컴포넌트 마운트 완료 시 실행되는 훅
             * @description Sortable 초기화를 처리합니다
             */
            onMounted(() => {
            // F5 키를 강력 새로고침에 매핑
            window.addEventListener('keydown', (e) => {
                if (e.key === 'F5') {
                    e.preventDefault();
                    strongRefresh();
                }
            });

                // 드래그 앤 드롭 기능 초기화
                taskManager.initializeSortable();
            });

            // 템플릿에서 사용할 반응형 데이터와 메서드들을 반환
            return {
                // 반응형 상태
                tasks: taskManager.tasks,
                inputVisible: taskManager.inputVisible,
                newTaskText: taskManager.newTaskText,
                taskInput: taskManager.taskInput,
                
                // 메서드들
                toggleTask: (taskId) => taskManager.toggleTask(taskId),
                showInput: () => taskManager.showInput(),
                hideInput: () => taskManager.hideInput(),
                addTask: () => taskManager.addTask(),
                strongRefresh
};
        }
    });

    // Vue 앱을 DOM에 마운트
    app.mount('#app');
