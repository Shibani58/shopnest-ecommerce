package com.shopnest.service;

import com.shopnest.dto.CatalogDtos.CategoryRequest;
import com.shopnest.dto.CatalogDtos.CategoryResponse;
import com.shopnest.entity.Category;
import com.shopnest.exception.BusinessException;
import com.shopnest.exception.ResourceNotFoundException;
import com.shopnest.repository.CategoryRepository;
import com.shopnest.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll() {
        return categoryRepository.findAllByOrderByNameAsc().stream().map(CategoryResponse::from).toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        String name = req.name().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Category '" + name + "' already exists");
        }
        return CategoryResponse.from(categoryRepository.save(new Category(name, req.description())));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest req) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        String name = req.name().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Category '" + name + "' already exists");
        }
        category.setName(name);
        category.setDescription(req.description());
        return CategoryResponse.from(category);
    }

    @Transactional
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category", id);
        }
        if (productRepository.existsByCategoryId(id)) {
            throw new BusinessException(HttpStatus.CONFLICT,
                    "This category still has products. Move or remove them first.");
        }
        categoryRepository.deleteById(id);
    }
}
