import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
  ) {}

  async create(dto: CreateReviewDto): Promise<Review> {
    const review = this.reviewRepo.create(dto);
    return this.reviewRepo.save(review);
  }

  async findAllByProduct(productId: string): Promise<Review[]> {
    return this.reviewRepo.find({ where: { productId } });
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async update(id: string, dto: UpdateReviewDto): Promise<Review> {
    const review = await this.findOne(id);
    Object.assign(review, dto);
    return this.reviewRepo.save(review);
  }

  async remove(id: string): Promise<void> {
    const review = await this.findOne(id);
    await this.reviewRepo.remove(review);
  }

  async getAverageRating(productId: string): Promise<number> {
    const { avg } = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.productId = :productId', { productId })
      .getRawOne();

    return parseFloat(avg) || 0;
  }
}
