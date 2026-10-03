import React from 'react';

export default function ChecklistSection({
  items,
  checkedItemIds,
  onToggleItem,
  onToggleMultipleItems
}) {
  // Helper to count checkable leaf nodes
  const getLeafItems = () => {
    const leaves = [];
    items.forEach(item => {
      if (item.subItems && item.subItems.length > 0) {
        leaves.push(...item.subItems);
      } else {
        leaves.push(item);
      }
    });
    return leaves;
  };

  const leafItems = getLeafItems();
  const checkedLeaves = leafItems.filter(leaf => checkedItemIds.includes(leaf.id));
  const completionPercentage = leafItems.length > 0
    ? Math.round((checkedLeaves.length / leafItems.length) * 100)
    : 0;

  // Handle parent check toggle (toggles all subitems)
  const handleParentToggle = (item, isCurrentlyChecked) => {
    if (item.subItems && item.subItems.length > 0) {
      const subItemIds = item.subItems.map(sub => sub.id);
      // If parent is currently fully checked, we uncheck all sub-items. Otherwise we check them all.
      onToggleMultipleItems(subItemIds, !isCurrentlyChecked);
    } else {
      onToggleItem(item.id);
    }
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-title">
        <span>
          📋 하루하루 점검사항
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--accent-green)' }}>
          {checkedLeaves.length} / {leafItems.length} 완료 ({completionPercentage}%)
        </span>
      </div>

      <div className="checklist-progress-bar-container">
        <div
          className="checklist-progress-bar"
          style={{ width: `${completionPercentage}%` }}
        ></div>
      </div>

      <div className="checklist-tree">
        {items.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;

          let isChecked = false;
          if (hasSubItems) {
            isChecked = item.subItems.every(sub => checkedItemIds.includes(sub.id));
          } else {
            isChecked = checkedItemIds.includes(item.id);
          }

          return (
            <div
              key={item.id}
              className={`checklist-item-wrapper ${isChecked ? 'checked' : ''}`}
            >
              <div
                className={`checklist-item ${hasSubItems ? 'has-subitems' : ''}`}
                onClick={() => handleParentToggle(item, isChecked)}
              >
                <div
                  className={`custom-checkbox ${isChecked ? 'checked' : ''}`}
                  role="checkbox"
                  aria-checked={isChecked}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleParentToggle(item, isChecked);
                    }
                  }}
                  onClick={(e) => {
                    // Prevent double triggering from outer div click
                    e.stopPropagation();
                    handleParentToggle(item, isChecked);
                  }}
                >
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="checklist-title">
                  {item.title}
                </span>
                {hasSubItems && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ({item.subItems.filter(sub => checkedItemIds.includes(sub.id)).length} / {item.subItems.length})
                  </span>
                )}
              </div>

              {hasSubItems && (
                <div className="sub-items-container">
                  {item.subItems.map((subItem) => {
                    const isSubChecked = checkedItemIds.includes(subItem.id);
                    return (
                      <div
                        key={subItem.id}
                        className={`sub-item ${isSubChecked ? 'checked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleItem(subItem.id);
                        }}
                      >
                        <div
                          className={`custom-checkbox ${isSubChecked ? 'checked' : ''}`}
                          role="checkbox"
                          aria-checked={isSubChecked}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              onToggleItem(subItem.id);
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleItem(subItem.id);
                          }}
                        >
                          <svg viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="sub-item-title">{subItem.title}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
