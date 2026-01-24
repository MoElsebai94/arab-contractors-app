/**
 * Dalot Filters Component
 * Filter controls for the Dalots page
 */

import { Search, Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const DalotFilters = ({
    searchTerm,
    setSearchTerm,
    sectionFilter,
    setSectionFilter,
    statusFilter,
    setStatusFilter,
    dimensionFilter,
    setDimensionFilter,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    sectionOptions,
    statusFilterOptions,
    dimensionFilterOptions,
    sortOptions,
    CustomDropdown,
    getDimensionClass,
    isRTL
}) => {
    const hasActiveFilters = searchTerm || sectionFilter || statusFilter || dimensionFilter;

    const clearAllFilters = () => {
        setSearchTerm('');
        setSectionFilter('');
        setStatusFilter('');
        setDimensionFilter('');
    };

    return (
        <div className="dalots-filters" role="search" aria-label={isRTL ? 'فلترة الدالوت' : 'Filter dalots'}>
            {/* Search Input */}
            <div className="search-input">
                <Search size={18} aria-hidden="true" />
                <input
                    type="text"
                    placeholder={isRTL ? 'بحث بالرقم...' : 'Search by ouvrage number...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label={isRTL ? 'بحث بالرقم' : 'Search by ouvrage number'}
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        aria-label={isRTL ? 'مسح البحث' : 'Clear search'}
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* Section Filter */}
            <div className="filter-group">
                <Filter size={16} aria-hidden="true" />
                <CustomDropdown
                    className="filter-dropdown"
                    value={sectionFilter}
                    options={sectionOptions}
                    onChange={setSectionFilter}
                    placeholder={isRTL ? 'كل الأقسام' : 'All Sections'}
                    isRTL={isRTL}
                />
            </div>

            {/* Status Filter */}
            <div className="filter-group">
                <CustomDropdown
                    className="filter-dropdown"
                    value={statusFilter}
                    options={statusFilterOptions}
                    onChange={setStatusFilter}
                    placeholder={isRTL ? 'كل الحالات' : 'All Statuses'}
                    isRTL={isRTL}
                />
            </div>

            {/* Dimension Filter */}
            <div className="filter-group">
                <CustomDropdown
                    className="filter-dropdown"
                    value={dimensionFilter}
                    options={dimensionFilterOptions}
                    onChange={setDimensionFilter}
                    placeholder={isRTL ? 'كل الأبعاد' : 'All Dimensions'}
                    isRTL={isRTL}
                    renderOption={(option) => (
                        <>
                            {option.value && (
                                <span
                                    className={`dimension-badge ${getDimensionClass(option.value)}`}
                                    style={{ marginRight: '0.5rem' }}
                                >
                                    {option.value}
                                </span>
                            )}
                            {!option.value && <span>{isRTL ? option.labelAr : option.label}</span>}
                        </>
                    )}
                />
            </div>

            {/* Sort Controls */}
            <div className="filter-group sort-group">
                <ArrowUpDown size={16} aria-hidden="true" />
                <CustomDropdown
                    className="filter-dropdown sort-dropdown"
                    value={sortField}
                    options={sortOptions}
                    onChange={setSortField}
                    placeholder={isRTL ? 'ترتيب حسب' : 'Sort by'}
                    isRTL={isRTL}
                />
                <button
                    className="sort-direction-btn"
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    title={sortDirection === 'asc' ? (isRTL ? 'تصاعدي' : 'Ascending') : (isRTL ? 'تنازلي' : 'Descending')}
                    aria-label={sortDirection === 'asc' ? (isRTL ? 'تصاعدي' : 'Sort ascending') : (isRTL ? 'تنازلي' : 'Sort descending')}
                >
                    {sortDirection === 'asc' ? (
                        <ArrowUp size={16} aria-hidden="true" />
                    ) : (
                        <ArrowDown size={16} aria-hidden="true" />
                    )}
                </button>
            </div>

            {/* Clear All Filters */}
            {hasActiveFilters && (
                <div className="filter-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={clearAllFilters}
                        aria-label={isRTL ? 'مسح كل الفلاتر' : 'Clear all filters'}
                    >
                        {isRTL ? 'مسح الكل' : 'Clear All'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default DalotFilters;
