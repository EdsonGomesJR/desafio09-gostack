import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);
    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: { name },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const searchedProductIDList = products.map(product => product.id);
    const orderList = await this.ormRepository.find({
      id: In(searchedProductIDList),
    });

    if (searchedProductIDList.length !== orderList.length) {
      throw new AppError('Missing Product');
    }

    return orderList;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const allProducts = await this.findAllById(products);
    const newProducts = allProducts.map(productData => {
      const productFound = products.find(
        product => product.id === productData.id,
      );

      if (!productFound) {
        throw new AppError('Product not Found');
      }
      const updatedProduct = productData;
      if (productData.quantity < productFound.quantity) {
        throw new AppError('The quantity is insufficient');
      }

      updatedProduct.quantity -= productFound.quantity;
      return updatedProduct;
    });

    await this.ormRepository.save(newProducts);

    return newProducts;
  }
}

export default ProductsRepository;
