/**
 * @file app-methods.js
 * @desc 독립 유틸/헬퍼 함수 모음 (전역에 노출)
 */

/**
 * 드래그 앤 드롭 정렬 기능을 관리하는 클래스
 * @class SortableManager
 * @description SortableJS 라이브러리를 사용하여 할 일 목록의 순서를 변경할 수 있게 합니다
 */
class SortableManager {
    /**
     * SortableManager 생성자
     * @constructor
     * @param {Vue.Ref} tasks - Vue 반응형 할 일 목록 참조
     * @description 드래그 앤 드롭 기능을 관리할 매니저를 초기화합니다
     */
    constructor(tasks) {
        /** @type {Vue.Ref} Vue 반응형 할 일 목록 */
        this.tasks = tasks;
        
        /** @type {Sortable|null} SortableJS 인스턴스 */
        this.sortableInstance = null;
        /** @type {HTMLElement|null} 직전 상단 밀림 카드 */
        this.pushPrev = null;
        /** @type {HTMLElement|null} 직전 하단 밀림 카드 */
        this.pushNext = null;
        /** @type {number} rAF 아이디 (0이면 미사용) */
        this._raf = 0;
        /** @type {{rel: HTMLElement, insertAfter: boolean}|null} 대기 중 업데이트 */
        this._pending = null;

    }

    /**
     * Sortable 인스턴스를 초기화하고 이벤트 핸들러를 등록
     * @method initialize
     * @description DOM 요소에 드래그 앤 드롭 기능을 적용합니다
     */
    initialize() {
        const sortableList = document.getElementById('sortable-list');
        
        if (sortableList && !this.sortableInstance) {
            this.sortableInstance = Sortable.create(sortableList, {
                animation: APP_CONFIG.ANIMATION_DURATION,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                handle: '.drag-handle',
                onEnd: (evt) => { if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; this._pending = null; } this._clearPush(); this.handleSort(evt); }, onMove: (evt) => { const rel = evt.related; if (!rel || !rel.classList || !rel.classList.contains('task-card')) return true; this._schedulePushUpdate(rel, !!evt.willInsertAfter); return true; }});
        }
    }

    /**
     * 드래그 앤 드롭 완료 시 호출되는 핸들러
     * @method handleSort
     * @param {Object} evt - SortableJS 이벤트 객체
     * @param {number} evt.oldIndex - 이전 위치 인덱스
     * @param {number} evt.newIndex - 새로운 위치 인덱스
     * @description Vue 데이터를 실제 DOM 순서와 동기화합니다
     */
    handleSort(evt) {
        const { oldIndex, newIndex } = evt;
        
        // Vue 반응형 배열에서 요소를 이동
        const movedTask = this.tasks.value.splice(oldIndex, 1)[0];
        this.tasks.value.splice(newIndex, 0, movedTask);
    }

    /**
     * Sortable 인스턴스를 정리하고 메모리 누수 방지
     * @method destroy
     * @description 컴포넌트가 제거될 때 정리 작업을 수행합니다
     */
    destroy() {
        if (this.sortableInstance) {
            this.sortableInstance.destroy();
            this.sortableInstance = null;
        }
    }

    /**
     * 밀림 효과 제거
     * @private
     */
    _clearPush() {
        if (this.pushPrev) { this.pushPrev.classList.remove('push-up', 'push-down'); this.pushPrev = null; }
        if (this.pushNext) { this.pushNext.classList.remove('push-up', 'push-down'); this.pushNext = null; }
    }

    /**
     * onMove에서 DOM 변경을 rAF로 배치(깜빡임/경합 방지)
     * @param {HTMLElement} rel
     * @param {boolean} insertAfter
     * @private
     */
    _schedulePushUpdate(rel, insertAfter) {
        this._pending = { rel, insertAfter };
        if (this._raf) return;
        this._raf = requestAnimationFrame(() => {
            this._raf = 0;
            const job = this._pending; this._pending = null;
            if (!job) return;
            this._doPushUpdate(job.rel, job.insertAfter);
        });
    }

    /**
     * 실제 밀림 대상 계산 (고스트/드래그 제외, 위/아래 각각 선택)
     * @param {HTMLElement} rel
     * @param {boolean} insertAfter
     * @private
     */
    _doPushUpdate(rel, insertAfter) {
        const isCard = (el) => el && el.classList && el.classList.contains('task-card');
        const isIgnored = (el) => el && el.classList && (
            el.classList.contains('sortable-chosen') ||
            el.classList.contains('sortable-drag') ||
            el.classList.contains('sortable-ghost')
        );
        const findPrevCard = (start) => { let n = start; while (n) { if (isCard(n) && !isIgnored(n)) return n; n = n.previousElementSibling; } return null; };
        const findNextCard = (start) => { let n = start; while (n) { if (isCard(n) && !isIgnored(n)) return n; n = n.nextElementSibling; } return null; };
        if (!rel) return;
        const upperStart = insertAfter ? rel : (rel && rel.previousElementSibling);
        const lowerStart = insertAfter ? (rel && rel.nextElementSibling) : rel;
        const upper = findPrevCard(upperStart);
        const lower = findNextCard(lowerStart);
        if (this.pushPrev && this.pushPrev !== upper) { this.pushPrev.classList.remove('push-up', 'push-down'); this.pushPrev = null; }
        if (this.pushNext && this.pushNext !== lower) { this.pushNext.classList.remove('push-up', 'push-down'); this.pushNext = null; }
        if (upper) { upper.classList.add('push-up'); upper.classList.remove('push-down'); this.pushPrev = upper; }
        if (lower) {
            if (upper && lower === upper) { lower.classList.add('push-down'); }
            else { lower.classList.add('push-down'); lower.classList.remove('push-up'); }
            this.pushNext = lower;
        }
    }

};


/**
 * 할 일 목록의 CRUD 작업과 상태 관리를 담당하는 클래스
 * @class TaskManager
 * @description 할 일 추가, 수정, 삭제, 완료/미완료 토글 등의 핵심 기능을 관리합니다
 */

class TaskManager {
    /**
     * TaskManager 생성자
     * @constructor
     * @description 할 일 관리에 필요한 모든 상태와 매니저를 초기화합니다
     */
    constructor() {
        /** @type {Vue.Ref<Array>} 할 일 목록 반응형 참조 */
        /* 로컬스토리지에서 복원, 없으면 기본값 */
        const __saved = (() => { try { return JSON.parse(localStorage.getItem('tasks')); } catch (e) { return null; } })();
        this.tasks = Vue.ref(Array.isArray(__saved) ? __saved : [...APP_CONFIG.DEFAULT_TASKS]);
        
        /** @type {Vue.Ref<boolean>} 입력창 표시 상태 */
        this.inputVisible = Vue.ref(false);
        
        /** @type {Vue.Ref<string>} 새 할 일 텍스트 입력값 */
        this.newTaskText = Vue.ref('');
        
        /** @type {Vue.Ref<HTMLInputElement|null>} 입력 필드 DOM 참조 */
        this.taskInput = Vue.ref(null);
        
        /** @type {SortableManager} 드래그 앤 드롭 매니저 인스턴스 */
        this.sortableManager = new SortableManager(this.tasks);
    }

    /**
     * 할 일 완료/미완료 상태를 토글
     * @method toggleTask
     * @param {number} taskId - 토글할 할 일의 고유 ID
     * @description 체크박스 클릭 시 해당 할 일의 완료 상태를 반전시킵니다
     */
    toggleTask(taskId) {
        const task = this.tasks.value.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
        }
    }

    /**
     * 새 할 일 입력창을 표시하고 포커스 설정
     * @method showInput
     * @description 플로팅 버튼 클릭 시 입력창을 보여주고 키보드 포커스를 설정합니다
     */
    showInput() {
        this.inputVisible.value = true;
        
        // DOM 업데이트 완료 후 포커스 설정
        Vue.nextTick(() => {
            if (this.taskInput.value) {
                this.taskInput.value.focus();
            }
        });
    }

    /**
     * 입력창을 숨기고 입력값을 초기화
     * @method hideInput
     * @description 취소 버튼 클릭 시 또는 입력 완료 후 입력창을 숨깁니다
     */
    hideInput() {
        this.inputVisible.value = false;
        this.newTaskText.value = '';
    }

    /**
     * 새로운 할 일을 목록에 추가
     * @method addTask
     * @description 입력된 텍스트를 검증하고 새로운 할 일 객체를 생성하여 목록에 추가합니다
     */
    addTask() {
        // 빈 문자열 및 공백만 있는 경우 무시
        if (this.newTaskText.value.trim()) {
            const newTask = {
                id: Utils.generateId(),
                text: this.newTaskText.value.trim(),
                completed: false
            };
            
            this.tasks.value.push(newTask);
            this.newTaskText.value = '';
            this.hideInput();
            
            // 새 항목 추가 후 Sortable 기능 재초기화
            Vue.nextTick(() => {
                this.sortableManager.initialize();
            });
        }
    }

    /**
     * Sortable 드래그 앤 드롭 기능을 초기화
     * @method initializeSortable
     * @description Vue 컴포넌트 마운트 완료 후 드래그 앤 드롭 기능을 활성화합니다
     */
    initializeSortable() {
        Vue.nextTick(() => {
            this.sortableManager.initialize();
        });
    }
};
